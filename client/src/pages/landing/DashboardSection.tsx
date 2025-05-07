import React, { useEffect, useState } from "react";
import { Truck, User, Clock, MapPin, ArrowRight } from "lucide-react";
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
  totalFreights: number;
  activeFreights: number;
  totalDrivers: number;
  recentFreights: RecentFreight[];
}

export const DashboardSection: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/public/stats');
        
        if (!response.ok) {
          throw new Error('Falha ao carregar estatísticas');
        }
        
        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
        setError('Não foi possível carregar as estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-primary/95">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-12">
            <div className="w-12 h-12 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error || !stats) {
    return null;
  }

  const { activeFreights, totalDrivers, recentFreights } = stats;

  return (
    <section className="py-16 bg-primary/95 text-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4 text-white">Sistema de Gestão de Fretes</h2>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Gerencie de forma eficiente motoristas, veículos, fretes e clientes
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Fretes Ativos Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-white/20 rounded-md mr-3">
                  <Truck className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Fretes Ativos</h3>
              </div>
              <p className="text-4xl font-bold">{activeFreights}</p>
            </div>
            
            {/* Motoristas Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-white/20 rounded-md mr-3">
                  <User className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Motoristas</h3>
              </div>
              <p className="text-4xl font-bold">{totalDrivers}</p>
            </div>
          </div>
          
          {/* Fretes Recentes */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-white/20 rounded-md mr-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold">Fretes Recentes</h3>
            </div>
            
            <div className="space-y-4">
              {recentFreights.map((freight) => (
                <div 
                  key={freight.id} 
                  className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:bg-white/20 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-white mr-2" />
                      <span className="font-medium">{freight.origin} - {freight.originState}</span>
                      <ArrowRight className="h-4 w-4 mx-2" />
                      <span className="font-medium">{freight.destination} - {freight.destinationState}</span>
                    </div>
                    <div className="font-bold text-green-300">
                      {formatCurrency(freight.value)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};