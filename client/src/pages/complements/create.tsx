import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Package, Calculator, MapPin } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { complementValidator, type Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import LocationInput from "@/components/location/location-input";

export default function CreateComplementPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cubicMeters, setCubicMeters] = useState<string>("0.000");

  // Buscar clientes
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm({
    resolver: zodResolver(complementValidator),
    defaultValues: {
      clientId: 0,
      origin: "",
      originState: "",
      destination: "",
      destinationState: "",
      weight: "",
      volumeQuantity: 1,
      volumeLength: "",
      volumeWidth: "",
      volumeHeight: "",
      invoiceValue: "",
      freightValue: "",
      contactName: "",
      contactPhone: "",
      observations: "",
    },
  });

  // Selecionar cliente automaticamente baseado no usuário
  useEffect(() => {
    // Verificar se o usuário tem clientId e se a lista de clientes foi carregada
    if (user?.clientId && clients.length > 0) {
      // Encontra o cliente associado ao usuário
      const userClient = clients.find(client => client.id === user.clientId);
      
      if (userClient) {
        form.setValue("clientId", userClient.id);
      } else {
        // Se o cliente não foi encontrado, pode ser um problema de timing ou filtragem
        console.warn("Cliente não encontrado na lista:", {
          userId: user.id,
          profileType: user.profileType,
          clientId: user.clientId,
          availableClients: clients.map(c => ({ id: c.id, name: c.name }))
        });
      }
    }
  }, [user, clients, form]);

  // Mutation para criar complemento
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/complements", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Complemento criado com sucesso!",
      });
      setLocation("/complements");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calcular metros cúbicos automaticamente
  const calculateCubicMeters = () => {
    const length = parseFloat(form.getValues("volumeLength") || "0");
    const width = parseFloat(form.getValues("volumeWidth") || "0");
    const height = parseFloat(form.getValues("volumeHeight") || "0");
    const quantity = form.getValues("volumeQuantity") || 0;
    
    const cubic = (length * width * height * quantity) / 1000000; // converter de cm³ para m³
    setCubicMeters(cubic.toFixed(3));
  };

  const onSubmit = (data: any) => {
    // Verificar se há um cliente selecionado
    if (!data.clientId || data.clientId === 0) {
      toast({
        title: "Erro",
        description: "Você precisa ter um cliente associado ao seu perfil para criar complementos.",
        variant: "destructive",
      });
      return;
    }
    
    createMutation.mutate(data);
  };

  // Watch para recalcular metros cúbicos quando as dimensões mudarem
  const watchedFields = form.watch(["volumeLength", "volumeWidth", "volumeHeight", "volumeQuantity"]);
  
  // Recalcular quando os campos mudarem
  useState(() => {
    calculateCubicMeters();
  });

  // Verificar se o usuário tem cliente associado
  const userHasClient = user?.clientId && user.clientId > 0;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" asChild>
          <Link href="/complements">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="h-8 w-8 text-primary" />
            Novo Complemento
          </h1>
          <p className="text-muted-foreground mt-1">
            Cadastre uma nova carga de complemento
          </p>
        </div>
      </div>

      {/* Aviso se não tiver cliente associado */}
      {!userHasClient && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Package className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Cliente não associado
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Para criar complementos de frete, você precisa ter um cliente associado ao seu perfil. 
                    Entre em contato com o administrador para associar um cliente ao seu usuário.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Informações do Complemento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Cliente - Seleção automática */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => {
                  const selectedClient = clients.find(client => client.id === field.value);
                  const userHasClient = user?.clientId && user.clientId > 0;
                  
                  return (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <FormControl>
                        <Input
                          value={selectedClient ? selectedClient.name : (userHasClient ? "Carregando cliente..." : "Nenhum cliente associado ao seu usuário")}
                          disabled
                          className="bg-muted"
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">
                        {userHasClient 
                          ? "Cliente selecionado automaticamente baseado no seu usuário"
                          : "Para criar complementos, você precisa ter um cliente associado ao seu perfil"
                        }
                      </p>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Origem e Destino */}
              <div>
                <Label className="text-base font-semibold flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  Origem e Destino
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="origin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Origem *</FormLabel>
                        <FormControl>
                          <LocationInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Digite a cidade de origem..."
                            onStateChange={(state) => {
                              form.setValue("originState", state);
                            }}
                            onCityChange={(city) => {
                              const currentValue = form.getValues("origin");
                              if (currentValue.includes(" - ")) {
                                const state = currentValue.split(" - ")[1];
                                form.setValue("origin", `${city} - ${state}`);
                              }
                            }}
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
                        <FormLabel>Destino *</FormLabel>
                        <FormControl>
                          <LocationInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Digite a cidade de destino..."
                            onStateChange={(state) => {
                              form.setValue("destinationState", state);
                            }}
                            onCityChange={(city) => {
                              const currentValue = form.getValues("destination");
                              if (currentValue.includes(" - ")) {
                                const state = currentValue.split(" - ")[1];
                                form.setValue("destination", `${city} - ${state}`);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Peso e Quantidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: 1500"
                          inputMode="decimal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="volumeQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Volumes *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          min="1"
                          placeholder="Ex: 10"
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value) || 1);
                            setTimeout(calculateCubicMeters, 100);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dimensões */}
              <div>
                <Label className="text-base font-semibold">Dimensões dos Volumes (cm)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="volumeLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Comprimento *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: 120"
                            inputMode="decimal"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setTimeout(calculateCubicMeters, 100);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="volumeWidth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Largura *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: 80"
                            inputMode="decimal"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setTimeout(calculateCubicMeters, 100);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="volumeHeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Ex: 60"
                            inputMode="decimal"
                            onChange={(e) => {
                              field.onChange(e.target.value);
                              setTimeout(calculateCubicMeters, 100);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Metros Cúbicos Calculados */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Metros Cúbicos Calculados</p>
                      <p className="text-2xl font-bold text-primary">{cubicMeters} m³</p>
                      <p className="text-sm text-muted-foreground">
                        Calculado automaticamente: {form.watch("volumeLength") || 0} × {form.watch("volumeWidth") || 0} × {form.watch("volumeHeight") || 0} × {form.watch("volumeQuantity") || 0} ÷ 1.000.000
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Valores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Nota Fiscal (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: 15000.00"
                          inputMode="decimal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freightValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Frete Complemento (R$) *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: 800.00"
                          inputMode="decimal"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Contato *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: João Silva"
                          autoComplete="name"
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
                      <FormLabel>Telefone do Contato *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Ex: (11) 99999-9999"
                          inputMode="tel"
                          autoComplete="tel"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Observações */}
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Informações adicionais sobre o complemento..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/complements")}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending ? "Criando..." : "Criar Complemento"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}