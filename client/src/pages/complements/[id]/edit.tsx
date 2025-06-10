import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Package, Calculator, MapPin } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { complementValidator, type Client, type Complement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import LocationInput from "@/components/location/location-input";

export default function EditComplementPage() {
  const [, params] = useRoute("/complements/:id/edit");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [cubicMeters, setCubicMeters] = useState<string>("0.000");

  const complementId = params?.id ? parseInt(params.id) : null;

  // Buscar complemento
  const { data: complement, isLoading: complementLoading } = useQuery<Complement>({
    queryKey: [`/api/complements/${complementId}`],
    enabled: !!complementId,
  });

  // Buscar clientes
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm({
    resolver: zodResolver(complementValidator),
    mode: "onChange",
    defaultValues: {
      clientId: "",
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

  // Preencher formulário quando complemento for carregado
  useEffect(() => {
    if (complement) {
      // Usar setValue para cada campo individualmente
      form.setValue("clientId", complement.clientId ? complement.clientId.toString() : "");
      form.setValue("origin", complement.origin || "");
      form.setValue("originState", complement.originState || "");
      form.setValue("destination", complement.destination || "");
      form.setValue("destinationState", complement.destinationState || "");
      form.setValue("weight", complement.weight || "");
      form.setValue("volumeQuantity", complement.volumeQuantity || 1);
      form.setValue("volumeLength", complement.volumeLength || "");
      form.setValue("volumeWidth", complement.volumeWidth || "");
      form.setValue("volumeHeight", complement.volumeHeight || "");
      form.setValue("invoiceValue", complement.invoiceValue || "");
      form.setValue("freightValue", complement.freightValue || "");
      form.setValue("contactName", complement.contactName || "");
      form.setValue("contactPhone", complement.contactPhone || "");
      form.setValue("observations", complement.observations || "");
      
      setCubicMeters(complement.cubicMeters || "0.000");
    }
  }, [complement, form]);

  // Mutation para atualizar complemento
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", `/api/complements/${complementId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/complements", complementId] });
      toast({
        title: "Sucesso",
        description: "Complemento atualizado com sucesso!",
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
    updateMutation.mutate(data);
  };

  // Watch para recalcular metros cúbicos quando as dimensões mudarem
  const watchedFields = form.watch(["volumeLength", "volumeWidth", "volumeHeight", "volumeQuantity"]);
  
  // Recalcular quando os campos mudarem
  useEffect(() => {
    calculateCubicMeters();
  }, [watchedFields]);

  if (complementLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!complement) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Complemento não encontrado</h3>
            <p className="text-muted-foreground mb-4">
              O complemento que você está procurando não existe ou foi removido.
            </p>
            <Button asChild>
              <Link href="/complements">Voltar para Complementos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            Editar Complemento #{complement.id}
          </h1>
          <p className="text-muted-foreground mt-1">
            Atualize as informações do complemento
          </p>
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Informações do Complemento</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Cliente */}
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cliente" />
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
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}