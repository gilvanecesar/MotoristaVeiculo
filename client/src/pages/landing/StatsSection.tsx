import React, { useEffect, useState } from "react";
import { Truck, Users, MapPin, Calendar, Loader2 } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  loading?: boolean;
}

// Interface para os dados de estatísticas da API
interface StatsData {
  totalFreights: number;
  activeFreights: number;
  totalDrivers: number;
  totalCities: number;
  yearsActive: number;
  totalUsers: number;
  totalClients: number;
  recentFreights: {
    id: number;
    origin: string;
    originState: string;
    destination: string;
    destinationState: string;
    value: number;
    createdAt: string;
  }[];
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label, loading }) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold mb-2 text-slate-900">
        {loading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : value}
      </div>
      <div className="text-slate-700">{label}</div>
    </div>
  );
};

const formatNumber = (num: number): string => {
  if (num < 1000) return String(num);
  return `+${Math.floor(num/1000)}.${String(num % 1000).padStart(3, '0')}`;
};

export const StatsSection: React.FC = () => {
  const [statsData, setStatsData] = useState<StatsData | null>(null);
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
        setStatsData(data);
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

  // Valores padrão para exibição enquanto carrega
  const stats = [
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      value: loading ? '' : statsData ? statsData.totalFreights : 0,
      formattedValue: loading ? '' : statsData ? formatNumber(statsData.activeFreights) : "0",
      label: "Fretes ativos",
      loading,
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: loading ? '' : statsData ? statsData.totalDrivers : 0,
      formattedValue: loading ? '' : statsData ? `+${statsData.totalDrivers}` : "0",
      label: "Motoristas cadastrados",
      loading,
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      value: loading ? '' : statsData ? statsData.totalCities : 0,
      formattedValue: loading ? '' : statsData ? `+${statsData.totalCities}` : "0",
      label: "Cidades atendidas",
      loading,
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      value: loading ? '' : statsData ? statsData.yearsActive : 3,
      formattedValue: loading ? '' : statsData ? statsData.yearsActive.toString() : "3",
      label: "Anos no mercado",
      loading,
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, index) => (
            <StatItem 
              key={index} 
              icon={stat.icon} 
              value={stat.formattedValue || stat.value}
              label={stat.label} 
              loading={stat.loading}
            />
          ))}
        </div>
        {error && (
          <div className="mt-6 text-center text-red-500">
            {error}
          </div>
        )}
      </div>
    </section>
  );
};