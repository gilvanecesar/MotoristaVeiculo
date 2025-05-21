import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import LocationInput from "@/components/location/location-input";

// Componente para criação simplificada de frete
export default function SimpleCreateFreight() {
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
        <h1 className="text-2xl font-bold">Criar Frete Simples</h1>
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
                  <Label htmlFor="origin">Cidade de Origem</Label>
                  <LocationInput
                    value={origin}
                    onChange={setOrigin}
                    onStateChange={setOriginState}
                    stateValue={originState}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="destination">Cidade de Destino</Label>
                  <LocationInput
                    value={destination}
                    onChange={setDestination}
                    onStateChange={setDestinationState}
                    stateValue={destinationState}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="freightValue">Valor do Frete (R$)</Label>
                  <Input
                    id="freightValue"
                    value={freightValue}
                    onChange={(e) => setFreightValue(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="productType">Tipo de Produto</Label>
                  <Input
                    id="productType"
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                    placeholder="Ex: Grãos, Bebidas, etc."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactName">Nome do Contato</Label>
                  <Input
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefone</Label>
                  <Input
                    id="contactPhone"
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