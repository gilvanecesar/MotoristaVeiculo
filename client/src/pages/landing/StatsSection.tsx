import React from "react";
import { Truck, Users, MapPin, Calendar } from "lucide-react";

interface StatItemProps {
  icon: React.ReactNode;
  value: string;
  label: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, value, label }) => {
  return (
    <div className="text-center">
      <div className="flex justify-center mb-4">
        <div className="p-4 bg-primary/10 rounded-full">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-slate-500">{label}</div>
    </div>
  );
};

export const StatsSection: React.FC = () => {
  const stats = [
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      value: "+15.000",
      label: "Fretes gerenciados",
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      value: "+3.500",
      label: "Usuários ativos",
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      value: "+500",
      label: "Cidades atendidas",
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      value: "3",
      label: "Anos no mercado",
    },
  ];

  return (
    <section className="py-20 bg-white border-y border-slate-200">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {stats.map((stat, index) => (
            <StatItem key={index} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
};