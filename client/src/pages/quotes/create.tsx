import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CitySearch } from "@/components/ui/city-search";

const brazilianStates = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" }
];

const urgencyOptions = [
  { value: "low", label: "Baixa" },
  { value: "medium", label: "Média" },
  { value: "high", label: "Alta" },
  { value: "urgent", label: "Urgente" }
];

interface CreateQuoteForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  origin: string;
  destination: string;
  cargoType: string;
  weight: number;
  volume: number;
  urgency: string;
  deliveryDate: string;
  price: number;
  observations?: string;
}

export default function CreateQuotePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateQuoteForm>({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    origin: "",
    destination: "",
    cargoType: "",
    weight: 0,
    volume: 0,
    urgency: "",
    deliveryDate: "",
    price: 0,
    observations: ""
  });

  const [deliveryDate, setDeliveryDate] = useState<Date>();

  const mutation = useMutation({
    mutationFn: (data: CreateQuoteForm) => {
      return fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Erro ao criar cotação');
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Cotação criada com sucesso!",
        description: "A cotação foi registrada no sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/quotes/stats'] });
      setLocation('/quotes');
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar cotação",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deliveryDate) {
      toast({
        title: "Data de entrega obrigatória",
        description: "Por favor, selecione a data de entrega.",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      ...formData,
      deliveryDate: deliveryDate.toISOString(),
      weight: Number(formData.weight),
      volume: Number(formData.volume),
      price: Number(formData.price),
    };

    mutation.mutate(submitData);
  };

  const handleInputChange = (field: keyof CreateQuoteForm, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Cabeçalho */}
        <div className="flex items-center mb-8">
          <Link href="/quotes">
            <Button variant="outline" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nova Cotação</h1>
            <p className="text-gray-600 mt-1">
              Crie uma nova solicitação de cotação de transporte
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Dados do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="clientName">Nome do Cliente *</Label>
                  <Input
                    id="clientName"
                    value={formData.clientName}
                    onChange={(e) => handleInputChange('clientName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="clientEmail">Email *</Label>
                  <Input
                    id="clientEmail"
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clientPhone">Telefone *</Label>
                <Input
                  id="clientPhone"
                  value={formData.clientPhone}
                  onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Origem e Destino */}
          <Card>
            <CardHeader>
              <CardTitle>Origem e Destino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Cidade de Origem *</Label>
                  <CitySearch
                    value={formData.origin}
                    onSelect={(city) => handleInputChange('origin', city)}
                    placeholder="Selecione a cidade de origem"
                  />
                </div>
                <div>
                  <Label>Cidade de Destino *</Label>
                  <CitySearch
                    value={formData.destination}
                    onSelect={(city) => handleInputChange('destination', city)}
                    placeholder="Selecione a cidade de destino"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes da Carga */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Carga</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="cargoType">Tipo de Carga *</Label>
                <Input
                  id="cargoType"
                  value={formData.cargoType}
                  onChange={(e) => handleInputChange('cargoType', e.target.value)}
                  placeholder="Ex: Eletrônicos, Alimentos, Materiais de Construção"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="volume">Volume (m³) *</Label>
                  <Input
                    id="volume"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.volume}
                    onChange={(e) => handleInputChange('volume', parseFloat(e.target.value))}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prazo e Preço */}
          <Card>
            <CardHeader>
              <CardTitle>Prazo e Preço</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Data de Entrega *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !deliveryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {deliveryDate ? format(deliveryDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={deliveryDate}
                        onSelect={setDeliveryDate}
                        initialFocus
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="urgency">Urgência *</Label>
                  <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a urgência" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="price">Valor de NF: *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <Label htmlFor="observations">Observações Adicionais</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) => handleInputChange('observations', e.target.value)}
                placeholder="Informações adicionais sobre a cotação..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Link href="/quotes">
              <Button variant="outline">Cancelar</Button>
            </Link>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Criando..." : "Criar Cotação"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}