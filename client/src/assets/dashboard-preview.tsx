import React from "react";

export const DashboardPreview: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg overflow-hidden shadow-xl">
      <div className="p-4 flex justify-between items-center border-b border-emerald-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="text-white font-medium">QUERO FRETES - Sistema de Gestão</div>
        <div className="w-5"></div>
      </div>
      
      <div className="p-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Sistema de Gestão de Fretes</h2>
          <p className="text-emerald-100">Gerencie de forma eficiente motoristas, veículos, fretes e clientes</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                <div className="w-4 h-4 bg-emerald-600 rounded-sm"></div>
              </div>
              <span className="text-white font-medium">Fretes Ativos</span>
            </div>
            <div className="text-3xl font-bold text-white">152</div>
          </div>
          
          <div className="bg-white bg-opacity-20 rounded-lg p-3 backdrop-blur-sm">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-2">
                <div className="w-4 h-4 bg-emerald-600 rounded-sm"></div>
              </div>
              <span className="text-white font-medium">Motoristas</span>
            </div>
            <div className="text-3xl font-bold text-white">87</div>
          </div>
        </div>
        
        <div className="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
          <h3 className="text-white font-medium mb-3">Fretes Recentes</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-white bg-opacity-10 rounded">
              <span className="text-emerald-50">Contagem - MG → São Paulo - SP</span>
              <span className="font-medium text-white">R$ 3.500,00</span>
            </div>
            <div className="flex justify-between p-2 bg-white bg-opacity-10 rounded">
              <span className="text-emerald-50">Ribeirão Preto - SP → Porto Alegre - RS</span>
              <span className="font-medium text-white">R$ 4.200,00</span>
            </div>
            <div className="flex justify-between p-2 bg-white bg-opacity-10 rounded">
              <span className="text-emerald-50">Recife - PE → Salvador - BA</span>
              <span className="font-medium text-white">R$ 2.800,00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;