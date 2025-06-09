import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useParams } from "wouter";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertVehicleSchema, VEHICLE_TYPES, BODY_TYPES } from "@shared/schema";
import { z } from "zod";
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
import { ArrowLeft } from "lucide-react";

// Simple schema for vehicle form
const vehicleFormSchema = z.object({
  driverId: z.number().min(1, "Selecione um motorista"),
  plate: z.string().min(1, "Placa é obrigatória"),
  brand: z.string().min(1, "Marca é obrigatória"),
  model: z.string().min(1, "Modelo é obrigatório"),
  year: z.number().min(1900, "Ano inválido"),
  color: z.string().min(1, "Cor é obrigatória"),
  vehicleType: z.string().min(1, "Tipo de veículo é obrigatório"),
  bodyType: z.string().min(1, "Tipo de carroceria é obrigatório"),
  capacity: z.string().min(1, "Capacidade é obrigatória"),
  renavam: z.string().min(1, "RENAVAM é obrigatório"),
  chassi: z.string().min(1, "Chassi é obrigatório"),
  observations: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export default function VehicleForm() {
  const params = useParams();
  const [, navigate] = useLocation();
  const isEditing = Boolean(params.id);
  const vehicleId = params.id;

  const [isLoadingVehicle, setIsLoadingVehicle] = useState(isEditing);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(insertVehicleSchema.omit({ id: true })),
    defaultValues: {
      driverId: 0,
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      vehicleType: "",
      bodyType: "",
      capacity: "",
      renavam: "",
      chassi: "",
      observations: "",
    },
  });

  // Carregar motoristas
  const loadDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await apiRequest("GET", "/api/drivers");
      if (response.ok) {
        const driversData = await response.json();
        setDrivers(driversData);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os motoristas.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar motoristas:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao carregar os motoristas.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Carregar dados do veículo (se editando)
  const loadVehicle = async () => {
    if (isEditing && vehicleId) {
      setIsLoadingVehicle(true);
      try {
        const response = await apiRequest("GET", `/api/vehicles/${vehicleId}`);
        if (response.ok) {
          const vehicle = await response.json();
          form.reset(vehicle);
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar os dados do veículo.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Erro ao carregar veículo:", error);
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar os dados do veículo.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingVehicle(false);
      }
    }
  };

  useEffect(() => {
    loadDrivers();
    if (isEditing) {
      loadVehicle();
    }
  }, [isEditing, vehicleId]);

  const onSubmit = async (data: VehicleFormValues) => {
    try {
      const url = isEditing ? `/api/vehicles/${vehicleId}` : "/api/vehicles";
      const method = isEditing ? "PUT" : "POST";

      const response = await apiRequest(method, url, data);

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Veículo ${isEditing ? "atualizado" : "criado"} com sucesso!`,
        });

        // Invalidar cache e redirecionar
        queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
        navigate("/vehicles");
      } else {
        const errorData = await response.text();
        toast({
          title: "Erro",
          description: errorData || "Ocorreu um erro ao salvar o veículo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao salvar veículo:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a operação.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container px-2 py-4 mx-auto">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/vehicles")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">
          {isEditing ? "Editar Veículo" : "Novo Veículo"}
        </h1>
      </div>

      {isLoadingVehicle ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Veículo</CardTitle>
                <CardDescription>
                  Preencha as informações básicas do veículo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="driverId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motorista</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um motorista" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id.toString()}>
                                {driver.name}
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
                    name="plate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Volvo, Mercedes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: FH 540, Atego" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1900"
                            max={new Date().getFullYear() + 1}
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Branco, Azul" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Veículo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {value}
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
                    name="bodyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Carroceria</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a carroceria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(BODY_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={value}>
                                {value}
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
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacidade (kg)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: 27000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="renavam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RENAVAM</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do RENAVAM" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="chassi"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chassi</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do chassi" {...field} />
                        </FormControl>
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
                          placeholder="Informações adicionais sobre o veículo..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Salvando..."
                  : isEditing
                  ? "Atualizar Veículo"
                  : "Criar Veículo"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/vehicles")}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}