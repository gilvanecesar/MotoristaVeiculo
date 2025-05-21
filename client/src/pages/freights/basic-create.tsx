import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Componente básico para criar fretes sem usar Form ou LocationInput
export default function BasicCreateFreight() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para os campos do formulário
  const [origin, setOrigin] = useState("");
  const [originState, setOriginState] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationState, setDestinationState] = useState("");
  const [freightValue, setFreightValue] = useState("");
  const [productType, setProductType] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Função para salvar o frete usando fetch diretamente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!origin || !originState || !destination || !destinationState) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha os campos de origem e destino",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Formatar o valor do frete para o formato esperado pelo backend
      let valorNumerico = freightValue.replace(/\./g, '').replace(',', '.');
      
      // Dados do frete
      const freightData = {
        origin,
        originState,
        destination,
        destinationState,
        freightValue: valorNumerico,
        productType,
        contactName,
        contactPhone,
        userId: user?.id,
        clientId: user?.clientId || 1, // Usar o cliente do usuário ou um valor padrão
        cargoType: "completa",
        needsTarp: "nao",
        tollOption: "incluso",
        status: "aberto",
        hasMultipleDestinations: false
      };
      
      console.log("Dados para envio:", freightData);
      
      // Enviar requisição diretamente com fetch
      const response = await fetch("/api/freights", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(freightData),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro completo:", errorText);
        throw new Error(`Erro ao criar frete: ${response.status} ${errorText}`);
      }
      
      const newFreight = await response.json();
      console.log("Frete criado com sucesso:", newFreight);
      
      // Atualizar cache
      queryClient.invalidateQueries({queryKey: ["/api/freights"]});
      
      toast({
        title: "Frete criado",
        description: "O frete foi criado com sucesso",
      });
      
      navigate("/freights");
    } catch (error) {
      console.error("Erro ao criar frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o frete",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Criar Frete</h1>
        <Button variant="outline" onClick={() => navigate("/freights")}>
          Voltar
        </Button>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Novo Frete</CardTitle>
          <CardDescription>
            Preencha os dados essenciais para criar um frete
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Cidade de Origem</div>
                  <Input
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Ex: São Paulo"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Estado de Origem</div>
                  <Input
                    value={originState}
                    onChange={(e) => setOriginState(e.target.value)}
                    placeholder="Ex: SP"
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Cidade de Destino</div>
                  <Input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Ex: Rio de Janeiro"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Estado de Destino</div>
                  <Input
                    value={destinationState}
                    onChange={(e) => setDestinationState(e.target.value)}
                    placeholder="Ex: RJ"
                    maxLength={2}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Valor do Frete (R$)</div>
                  <Input
                    value={freightValue}
                    onChange={(e) => setFreightValue(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tipo de Produto</div>
                  <Input
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Ex: Grãos, Bebidas, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Nome do Contato</div>
                  <Input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Telefone</div>
                  <Input
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/freights")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Criar Frete"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}