import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  vehicleValidator, 
  driverValidator, 
  VEHICLE_TYPES, 
  BODY_TYPES 
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCPF, formatPhone, formatCEP } from "@/lib/utils/masks";
import { VehicleForm } from "@/components/drivers/vehicle-form";
import { z } from "zod";

// Combined schema for driver with vehicles
const driverWithVehiclesSchema = driverValidator.extend({
  vehicles: z.array(
    vehicleValidator.omit({ driverId: true })
  ).optional(),
});

type FormValues = z.infer<typeof driverWithVehiclesSchema>;

export default function DriverForm() {
  const [, navigate] = useLocation();
  const params = useParams();
  const [match, routeParams] = useRoute("/drivers/:id");
  const { toast } = useToast();
  
  // Usar routeParams ao invés de params
  const isEditing = match && routeParams?.id && routeParams.id !== "new";
  const driverId = isEditing ? parseInt(routeParams.id) : undefined;

  // Form with validation
  const form = useForm<FormValues>({
    resolver: zodResolver(driverWithVehiclesSchema),
    defaultValues: {
      name: "",
      email: "",
      cpf: "",
      phone: "",
      whatsapp: "",
      birthdate: "",
      cnh: "",
      cnhCategory: "",
      cnhExpiration: "",
      cnhIssueDate: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipcode: "",
      vehicles: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "vehicles",
  });

  // Get driver data if editing
  const { data: driver, isLoading } = useQuery({
    queryKey: ["/api/drivers", driverId],
    queryFn: async () => {
      if (!driverId) return null;
      const res = await fetch(`/api/drivers/${driverId}`);
      if (!res.ok) throw new Error("Failed to fetch driver");
      return res.json();
    },
    enabled: !!isEditing && !!driverId,
  });

  // Load driver data into form when available
  useEffect(() => {
    if (driver && !isLoading) {
      // Format dates for form inputs
      const formatDate = (date: string) => {
        return new Date(date).toISOString().split('T')[0];
      };

      const formattedDriver = {
        ...driver,
        birthdate: formatDate(driver.birthdate),
        cnhExpiration: formatDate(driver.cnhExpiration),
        cnhIssueDate: formatDate(driver.cnhIssueDate),
      };
      
      // Reset form with driver data
      form.reset(formattedDriver);
    }
  }, [driver, isLoading, form]);

  // Create driver mutation
  const createDriver = useMutation({
    mutationFn: async (data: FormValues) => {
      const { vehicles, ...driverData } = data;
      
      // Format dates properly for the API
      const formattedData = {
        ...driverData,
        // Convert dates to ISO string format for API
        birthdate: driverData.birthdate instanceof Date 
          ? driverData.birthdate.toISOString() 
          : new Date(driverData.birthdate).toISOString(),
        cnhExpiration: driverData.cnhExpiration instanceof Date 
          ? driverData.cnhExpiration.toISOString() 
          : new Date(driverData.cnhExpiration).toISOString(),
        cnhIssueDate: driverData.cnhIssueDate instanceof Date 
          ? driverData.cnhIssueDate.toISOString() 
          : new Date(driverData.cnhIssueDate).toISOString(),
      };
      
      // First create the driver
      const driverRes = await apiRequest("POST", "/api/drivers", formattedData);
      const newDriver = await driverRes.json();
      
      // Then create vehicles if any
      if (vehicles && vehicles.length > 0) {
        for (const vehicle of vehicles) {
          await apiRequest("POST", "/api/vehicles", {
            ...vehicle,
            driverId: newDriver.id,
          });
        }
      }
      
      return newDriver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      toast({
        title: "Sucesso",
        description: "Motorista cadastrado com sucesso!",
      });
      navigate("/drivers");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao cadastrar motorista: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update driver mutation
  const updateDriver = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!driverId) throw new Error("Driver ID is required");
      
      const { vehicles, ...driverData } = data;
      
      // Format dates properly for the API
      const formattedData = {
        ...driverData,
        // Convert dates to ISO string format for API
        birthdate: driverData.birthdate instanceof Date 
          ? driverData.birthdate.toISOString() 
          : new Date(driverData.birthdate).toISOString(),
        cnhExpiration: driverData.cnhExpiration instanceof Date 
          ? driverData.cnhExpiration.toISOString() 
          : new Date(driverData.cnhExpiration).toISOString(),
        cnhIssueDate: driverData.cnhIssueDate instanceof Date 
          ? driverData.cnhIssueDate.toISOString() 
          : new Date(driverData.cnhIssueDate).toISOString(),
      };
      
      // Update driver
      const driverRes = await apiRequest("PUT", `/api/drivers/${driverId}`, formattedData);
      const updatedDriver = await driverRes.json();
      
      // Handle vehicles - this is simplified, a real app might need more complex logic
      // to handle vehicle updates, deletions, and creations
      if (vehicles && vehicles.length > 0) {
        // Get existing vehicles
        const existingVehiclesRes = await fetch(`/api/vehicles?driverId=${driverId}`);
        const existingVehicles = await existingVehiclesRes.json();
        
        // Delete all existing vehicles
        for (const vehicle of existingVehicles) {
          await apiRequest("DELETE", `/api/vehicles/${vehicle.id}`);
        }
        
        // Create new vehicles
        for (const vehicle of vehicles) {
          await apiRequest("POST", "/api/vehicles", {
            ...vehicle,
            driverId: driverId,
          });
        }
      }
      
      return updatedDriver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drivers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      toast({
        title: "Sucesso",
        description: "Motorista atualizado com sucesso!",
      });
      navigate("/drivers");
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar motorista: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission
  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateDriver.mutate(data);
    } else {
      createDriver.mutate(data);
    }
  };

  const addVehicle = () => {
    append({
      plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      renavam: "",
      vehicleType: VEHICLE_TYPES.LEVE_TODOS,
      bodyType: BODY_TYPES.FECHADA,
    });
  };

  // Handle input formatting
  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    form.setValue("cpf", formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    form.setValue("phone", formatted);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    form.setValue("zipcode", formatted);
  };

  // Generate vehicle count text
  const getVehicleCountText = () => {
    if (fields.length === 0) {
      return "Nenhum veículo cadastrado. Clique em \"Adicionar Veículo\" para cadastrar.";
    }
    return `${fields.length} ${fields.length === 1 ? 'veículo cadastrado' : 'veículos cadastrados'}`;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {isEditing ? "Editar Motorista" : "Cadastrar Novo Motorista"}
          </h2>
          <p className="text-sm text-slate-500">
            {isEditing ? "Atualize os dados do motorista" : "Preencha os dados do motorista"}
          </p>
        </div>
        <Button variant="ghost" onClick={() => navigate("/drivers")}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Informações Pessoais
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Nome Completo
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          CPF
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="000.000.000-00" 
                            onChange={handleCPFChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Telefone
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(00) 00000-0000" 
                            onChange={handlePhoneChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          WhatsApp
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="(00) 00000-0000" 
                            onChange={(e) => {
                              const formatted = formatPhone(e.target.value);
                              form.setValue("whatsapp", formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="birthdate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Data de Nascimento
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* License Information */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Informações da CNH
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cnh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Número da CNH
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cnhCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Categoria
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cnhExpiration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Data de Validade
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cnhIssueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Data de Emissão
                        </FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Address */}
              <div>
                <h3 className="text-md font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Endereço
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="street"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                            Logradouro
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Número
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="complement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Bairro
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Cidade
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          Estado
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[
                              "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
                              "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
                              "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
                            ].map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="zipcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="after:content-['*'] after:text-red-500 after:ml-0.5">
                          CEP
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="00000-000" 
                            onChange={handleCEPChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Vehicles */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-semibold text-slate-800 pb-2 border-b border-slate-200 flex-1">
                    Veículos
                  </h3>
                  <Button 
                    type="button" 
                    variant="default"
                    size="sm"
                    onClick={addVehicle} 
                    className="ml-4 bg-blue-600 hover:bg-blue-700 text-white shadow-md font-medium"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Veículo
                  </Button>
                </div>
                
                <div>
                  {fields.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                      <div className="text-slate-500 mb-3">
                        Nenhum veículo cadastrado ainda
                      </div>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={addVehicle}
                        className="border-blue-600 text-blue-600 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Cadastrar Primeiro Veículo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <VehicleForm
                          key={field.id}
                          index={index}
                          control={form.control}
                          onRemove={() => remove(index)}
                        />
                      ))}
                      
                      {/* Botão adicional no final da lista */}
                      <div className="flex justify-center pt-4">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={addVehicle}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Outro Veículo
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/drivers")}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createDriver.isPending || updateDriver.isPending || isLoading}
                >
                  {createDriver.isPending || updateDriver.isPending
                    ? "Salvando..."
                    : isEditing
                    ? "Atualizar Motorista"
                    : "Salvar Motorista"
                  }
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
