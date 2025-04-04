import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { USER_TYPES } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Truck, Factory, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

/**
 * Página de seleção de tipo de perfil após o registro
 * Esta página será exibida após o registro, permitindo que o usuário selecione
 * que tipo de perfil deseja criar (embarcador, motorista ou transportadora)
 */
export default function ProfileSelectionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Redirecionar se o usuário não estiver logado
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Função para confirmar a seleção e redirecionar para o cadastro específico
  const handleConfirmSelection = async () => {
    if (!selectedRole) {
      toast({
        title: "Tipo de perfil não selecionado",
        description: "Por favor, selecione um tipo de perfil para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Atualizar o tipo de perfil do usuário
      const response = await apiRequest("POST", "/api/users/update-profile-type", {
        profileType: selectedRole
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar tipo de perfil");
      }

      // Se for motorista, ativa o acesso gratuito automaticamente
      if (selectedRole === USER_TYPES.DRIVER) {
        // Ativa o acesso gratuito para motoristas
        const driverResponse = await apiRequest("POST", "/api/activate-driver-access", {});
        
        if (!driverResponse.ok) {
          throw new Error("Erro ao ativar acesso de motorista");
        }

        toast({
          title: "Perfil configurado com sucesso",
          description: "Seu acesso gratuito de motorista foi ativado!",
        });

        // Redireciona para o cadastro de motorista
        navigate("/drivers/create");
      } 
      else if (selectedRole === USER_TYPES.SHIPPER) {
        toast({
          title: "Perfil configurado com sucesso",
          description: "Agora vamos cadastrar seus dados de embarcador.",
        });
        
        // Redireciona para o cadastro de cliente/embarcador
        navigate("/clients/create");
      }
      else if (selectedRole === USER_TYPES.AGENT) {
        toast({
          title: "Perfil configurado com sucesso",
          description: "Agora vamos cadastrar seus dados de transportadora.",
        });
        
        // Redireciona para o cadastro de cliente/transportadora
        navigate("/clients/create");
      }
    } catch (error) {
      console.error("Erro ao configurar perfil:", error);
      toast({
        title: "Erro ao configurar perfil",
        description: "Não foi possível configurar seu tipo de perfil. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Bem-vindo(a) ao QUERO FRETES, {user.name}!</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Selecione um tipo de perfil para configurar sua conta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Embarcador */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === USER_TYPES.SHIPPER ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole(USER_TYPES.SHIPPER)}
          >
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-center">Embarcador</CardTitle>
              <CardDescription className="text-center">
                Preciso transportar cargas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Publicar fretes disponíveis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Encontrar motoristas</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Gerenciar seus fretes</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <div className="w-full text-center">
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  Requer assinatura
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Motorista */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === USER_TYPES.DRIVER ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole(USER_TYPES.DRIVER)}
          >
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Motorista</CardTitle>
              <CardDescription className="text-center">
                Transporto cargas com meu veículo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Encontrar fretes disponíveis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Cadastrar seus veículos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Acesso 100% gratuito</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <div className="w-full text-center">
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Gratuito
                </span>
              </div>
            </CardFooter>
          </Card>

          {/* Transportadora */}
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole === USER_TYPES.AGENT ? 'border-primary ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedRole(USER_TYPES.AGENT)}
          >
            <CardHeader>
              <div className="flex justify-center mb-2">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Factory className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-center">Transportadora</CardTitle>
              <CardDescription className="text-center">
                Administro uma frota de veículos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Gerenciar motoristas e veículos</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Encontrar e publicar fretes</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  <span>Administrar sua operação</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <div className="w-full text-center">
                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                  Requer assinatura
                </span>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button 
            size="lg" 
            onClick={handleConfirmSelection}
            disabled={!selectedRole || isSaving}
            className="px-8"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Continuar"
            )}
          </Button>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 inline-block mr-1" />
          <span>
            Você precisará completar seu cadastro na próxima etapa com informações adicionais.
          </span>
        </div>
      </div>
    </div>
  );
}