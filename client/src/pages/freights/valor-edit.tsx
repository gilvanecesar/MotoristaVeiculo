import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { 
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Formulário super simples só para editar o valor do frete
export default function ValorFreteEdit() {
  const params = useParams();
  const freightId = params.id;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [freightValue, setFreightValue] = useState("");
  const [originalFreight, setOriginalFreight] = useState<any>(null);

  // Carregar dados do frete
  useEffect(() => {
    async function loadFreight() {
      if (!freightId) return;
      
      try {
        setIsLoading(true);
        const response = await apiRequest("GET", `/api/freights/${freightId}`);
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do frete");
        }
        
        const freight = await response.json();
        console.log("Frete carregado:", freight);
        
        // Converter para formato de moeda brasileiro
        const valorFormatado = freight.freightValue 
          ? parseFloat(freight.freightValue).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })
          : "";
        
        setFreightValue(valorFormatado);
        setOriginalFreight(freight);
        setIsLoading(false);
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
  }, [freightId, navigate]);

  // Função para salvar as alterações
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalFreight) return;
    
    try {
      setIsSaving(true);
      
      // Formatar o valor do frete para o formato esperado pelo backend
      let valorNumerico = freightValue.replace(/\./g, '').replace(',', '.');
      
      console.log("Valor original:", originalFreight.freightValue);
      console.log("Valor formatado para envio:", valorNumerico);
      
      // Prepara dados atualizados mantendo os campos originais
      const updatedData = {
        ...originalFreight,
        freightValue: valorNumerico,
        userId: user?.id || originalFreight.userId
      };
      
      // Enviar requisição para rota simplificada de atualização de valor
      const response = await apiRequest(
        "POST",
        `/api/freights/${freightId}/update-value`,
        { freightValue: valorNumerico }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erro completo:", errorText);
        throw new Error(`Erro ao atualizar frete: ${response.status} ${errorText}`);
      }
      
      // Atualizar cache e redirecionar
      queryClient.invalidateQueries({queryKey: ["/api/freights"]});
      
      toast({
        title: "Frete atualizado",
        description: "O valor do frete foi atualizado com sucesso",
      });
      
      navigate(`/freights/${freightId}`);
    } catch (error) {
      console.error("Erro ao atualizar valor do frete:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor do frete",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        <h1 className="text-2xl font-bold">Editar Valor do Frete</h1>
        <Button variant="outline" onClick={() => navigate(`/freights/${freightId}`)}>
          Voltar
        </Button>
      </div>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Atualizar Valor</CardTitle>
          <CardDescription>
            Atualize apenas o valor do frete
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="freightValue">Valor do Frete (R$)</Label>
                <Input
                  id="freightValue"
                  value={freightValue}
                  onChange={(e) => setFreightValue(e.target.value)}
                  placeholder="0,00"
                  className="text-lg"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/freights/${freightId}`)}
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
                "Atualizar Valor"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}