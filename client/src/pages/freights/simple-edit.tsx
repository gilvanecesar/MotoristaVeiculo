import { useState, useEffect } from "react";
import { z } from "zod";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent 
} from "@/components/ui/card";
import { 
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import LocationInput from "@/components/location/location-input";
import { insertFreightSchema } from "@shared/schema";

// Formulário simplificado de edição de frete
export default function SimpleFreightEdit() {
  const params = useParams();
  const freightId = params.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasMultipleDestinations, setHasMultipleDestinations] = useState(false);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [hasInitializedFreight, setHasInitializedFreight] = useState(false);

  // Configurar formulário com Zod
  const form = useForm({
    resolver: zodResolver(insertFreightSchema.omit({ 
      // Omitir campos complexos que podem causar problemas de validação
      vehicleTypesSelected: true,
      bodyTypesSelected: true 
    })),
    defaultValues: {
      clientId: 0,
      origin: "",
      originState: "",
      destination: "",
      destinationState: "",
      cargoType: "completa",
      needsTarp: "nao",
      productType: "",
      cargoWeight: "",
      vehicleType: "",
      vehicleTypesSelected: "",
      bodyType: "",
      bodyTypesSelected: "",
      freightValue: "",
      tollOption: "incluso",
      paymentMethod: "",
      observations: "",
      status: "aberto",
      contactName: "",
      contactPhone: "",
      hasMultipleDestinations: false,
    }
  });

  // Carregar dados do frete
  useEffect(() => {
    async function loadFreight() {
      if (!freightId || hasInitializedFreight) return;
      
      try {
        const response = await apiRequest("GET", `/api/freights/${freightId}`);
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do frete");
        }
        
        const freight = await response.json();
        console.log("Frete carregado:", freight);
        
        // Preencher o formulário com os dados do frete
        form.reset({
          ...freight,
          clientId: freight.clientId,
          hasMultipleDestinations: freight.destinations && freight.destinations.length > 0,
        });
        
        // Atualizar estados locais
        setHasMultipleDestinations(
          freight.destinations && freight.destinations.length > 0
        );
        
        // Buscar e configurar destinos
        if (freight.destinations && freight.destinations.length > 0) {
          setDestinations(freight.destinations);
        }
        
        setIsLoading(false);
        setHasInitializedFreight(true);
      } catch (error) {
        console.error("Erro ao carregar frete:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do frete",
          variant: "destructive",
        });
        navigate("/freights");
      }
    }
    
    loadFreight();
  }, [freightId, hasInitializedFreight, navigate]);

  // Função para adicionar um novo destino
  const addDestination = () => {
    setDestinations([...destinations, { destination: "", destinationState: "" }]);
  };

  // Função para remover um destino
  const removeDestination = (index: number) => {
    setDestinations(destinations.filter((_, i) => i !== index));
  };

  // Função para atualizar um destino
  const updateDestination = (index: number, field: string, value: string) => {
    const newDestinations = [...destinations];
    newDestinations[index] = { ...newDestinations[index], [field]: value };
    setDestinations(newDestinations);
  };

  // Função para salvar as alterações
  const onSubmit = async (data: any) => {
    console.log("Enviando formulário de edição simples:", data);
    
    // Formatando o valor do frete para formato numérico
    if (data.freightValue) {
      data.freightValue = data.freightValue.replace(/\./g, '').replace(',', '.');
    }
    
    // Certifique-se de manter os campos obrigatórios
    const freightData = {
      ...data,
      userId: user?.id,
      clientId: parseInt(data.clientId) || form.getValues("clientId"),
      hasMultipleDestinations: hasMultipleDestinations
    };
    
    console.log("Dados formatados para envio:", freightData);
    
    try {
      // Enviar atualização para a API
      const response = await apiRequest(
        "PUT",
        `/api/freights/${freightId}`,
        freightData
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro completo:", errorText);
        throw new Error(`Erro ao atualizar frete: ${response.status} ${errorText}`);
      }
      
      const updatedFreight = await response.json();
      console.log("Frete atualizado com sucesso:", updatedFreight);
      
      // Se tem múltiplos destinos, processar destinos
      if (data.hasMultipleDestinations && destinations.length > 0) {
        // Primeiro remover destinos antigos
        if (destinations.some(d => d.id)) {
          await Promise.all(
            destinations.filter(d => d.id).map(async (dest) => {
              await apiRequest("DELETE", `/api/freight-destinations/${dest.id}`);
            })
          );
        }
        
        // Depois adicionar novos destinos
        await Promise.all(
          destinations.map(async (dest) => {
            if (dest.destination && dest.destinationState) {
              await apiRequest("POST", "/api/freight-destinations", {
                freightId: updatedFreight.id,
                destination: dest.destination,
                destinationState: dest.destinationState,
              });
            }
          })
        );
      }
      
      // Atualizar cache e redirecionar
      queryClient.invalidateQueries({queryKey: ["/api/freights"]});
      
      toast({
        title: "Frete atualizado",
        description: "O frete foi atualizado com sucesso",
      });
      
      navigate("/freights");
    } catch (error) {
      console.error("Erro ao atualizar frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o frete",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Editar Frete</h1>
        <Button variant="outline" onClick={() => navigate("/freights")}>
          Voltar
        </Button>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados essenciais do frete</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade de Origem</FormLabel>
                    <FormControl>
                      <LocationInput
                        value={field.value}
                        onChange={field.onChange}
                        onStateChange={(state) => form.setValue("originState", state)}
                        stateValue={form.watch("originState")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="hasMultipleDestinations"
                  checked={hasMultipleDestinations}
                  onCheckedChange={(checked) => {
                    setHasMultipleDestinations(!!checked);
                    form.setValue("hasMultipleDestinations", !!checked);
                  }}
                />
                <label
                  htmlFor="hasMultipleDestinations"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Múltiplos destinos
                </label>
              </div>
              
              {!hasMultipleDestinations && (
                <FormField
                  control={form.control}
                  name="destination"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade de Destino</FormLabel>
                      <FormControl>
                        <LocationInput
                          value={field.value}
                          onChange={field.onChange}
                          onStateChange={(state) => form.setValue("destinationState", state)}
                          stateValue={form.watch("destinationState")}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addDestination}
                    >
                      Adicionar Destino
                    </Button>
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
                                value={dest.destination || ""}
                                onChange={(value) => updateDestination(index, "destination", value)}
                                onStateChange={(state) => updateDestination(index, "destinationState", state)}
                                stateValue={dest.destinationState || ""}
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDestination(index)}
                          >
                            Remover
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              <FormField
                control={form.control}
                name="freightValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Frete (R$)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="0,00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/freights")}
            >
              Cancelar
            </Button>
            <Button type="submit">
              Atualizar Frete
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}