import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { formatCPF, formatPhone, formatCEP } from "@/lib/utils/masks";

// Função helper para formatar CNPJ
const formatCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}/${match[4]}-${match[5]}`;
  }
  return cleaned;
};

const clientRegistrationSchema = z.object({
  companyName: z.string().min(2, "Nome da empresa é obrigatório"),
  tradingName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  address: z.string().min(5, "Endereço é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().min(2, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP é obrigatório"),
  contactName: z.string().min(2, "Nome do contato é obrigatório"),
  contactPhone: z.string().min(10, "Telefone de contato é obrigatório"),
  contactEmail: z.string().email("Email de contato inválido"),
});

type ClientRegistrationFormValues = z.infer<typeof clientRegistrationSchema>;

export default function ClientRegistrationPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<ClientRegistrationFormValues>({
    resolver: zodResolver(clientRegistrationSchema),
    defaultValues: {
      companyName: "",
      tradingName: "",
      cnpj: "",
      stateRegistration: "",
      municipalRegistration: "",
      address: "",
      addressNumber: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
    },
  });

  const onSubmit = async (data: ClientRegistrationFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/clients", data);
      
      if (response.ok) {
        toast({
          title: "Cadastro realizado com sucesso",
          description: "Agora você será direcionado para escolher seu plano de assinatura.",
        });
        
        // Redireciona para página de cobrança/checkout
        setLocation("/checkout?plan=monthly");
      } else {
        throw new Error("Erro ao salvar cadastro");
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      toast({
        title: "Erro ao cadastrar",
        description: "Não foi possível completar seu cadastro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete seu Cadastro</CardTitle>
            <CardDescription>
              Para continuar, precisamos de algumas informações sobre sua empresa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados da Empresa */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dados da Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Razão Social *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="tradingName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome Fantasia</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome fantasia" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cnpj"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00.000.000/0000-00" 
                              {...field}
                              onChange={(e) => field.onChange(formatCNPJ(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="stateRegistration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição Estadual</FormLabel>
                          <FormControl>
                            <Input placeholder="Inscrição estadual" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Endereço */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endereço *</FormLabel>
                            <FormControl>
                              <Input placeholder="Rua, Avenida, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="addressNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número *</FormLabel>
                          <FormControl>
                            <Input placeholder="123" {...field} />
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
                            <Input placeholder="Sala, andar, etc." {...field} />
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
                          <FormLabel>Bairro *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do bairro" {...field} />
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
                          <FormLabel>Cidade *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da cidade" {...field} />
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
                          <FormLabel>Estado *</FormLabel>
                          <FormControl>
                            <Input placeholder="UF" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="00000-000" 
                              {...field}
                              onChange={(e) => field.onChange(formatCEP(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contato */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Dados de Contato</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Contato *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome completo" {...field} />
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
                          <FormLabel>Telefone *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="(00) 00000-0000" 
                              {...field}
                              onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="contactEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email de Contato *</FormLabel>
                            <FormControl>
                              <Input placeholder="contato@empresa.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[200px]"
                  >
                    {isLoading ? "Salvando..." : "Continuar para Pagamento"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}