import React, { useEffect, useState } from "react";
import { Truck, Calendar, MapPin, DollarSign, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

// Interface para os fretes recebidos da API
interface RecentFreight {
  id: number;
  origin: string;
  originState: string;
  destination: string;
  destinationState: string;
  value: number;
  createdAt: string;
}

interface StatsData {
  recentFreights: RecentFreight[];
}

interface FreightCardProps {
  freight: RecentFreight;
}

const FreightCard: React.FC<FreightCardProps> = ({ freight }) => {
  const formattedDate = new Date(freight.createdAt).toLocaleDateString('pt-BR');
  const formattedValue = formatCurrency(freight.value);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 hover:border-primary transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 rounded-full">
          <Truck className="h-6 w-6 text-primary" />
        </div>
        <div className="flex items-center text-sm text-slate-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>{formattedDate}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-slate-900">Origem:</div>
            <div className="text-slate-600">{freight.origin}/{freight.originState}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <MapPin className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-slate-900">Destino:</div>
            <div className="text-slate-600">{freight.destination}/{freight.destinationState}</div>
          </div>
        </div>
        
        <div className="flex items-start">
          <DollarSign className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-medium text-slate-900">Valor:</div>
            <div className="text-green-600 font-semibold">{formattedValue}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RecentFreightsSection: React.FC = () => {
  const [freightsData, setFreightsData] = useState<RecentFreight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFreights = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/stats');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar fretes recentes');
        }
        
        const data: StatsData = await response.json();
        setFreightsData(data.recentFreights || []);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar fretes recentes:', err);
        setError('Não foi possível carregar os fretes recentes');
      } finally {
        setLoading(false);
      }
    };

    fetchFreights();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8 text-slate-900">Fretes Recentes</h2>
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || freightsData.length === 0) {
    return null; // Não mostrar a seção se não tiver dados
  }

  return (
    <section className="py-16 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">Fretes Recentes</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Confira alguns dos fretes disponíveis recentemente em nossa plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {freightsData.map(freight => (
            <FreightCard key={freight.id} freight={freight} />
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
            Ver Todos os Fretes
          </Button>
        </div>
      </div>
    </section>
  );
};