import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, Calculator, FileText, Scale } from "lucide-react";

interface CalculationInfoProps {
  selectedCategory: string;
  selectedCargoType: string;
  selectedAxles: string;
}

const categoryInfo = {
  CARGA_LOTACAO: {
    title: "Carga e descarga (CC)",
    description: "Coeficientes de pisos mínimos para transporte rodoviário de carga lotação conforme tabela A da RESOLUÇÃO Nº 6.067/2025.",
    formula: "Valor do Frete = (Distância × CCD) + CC",
    reference: "Tabela A - ANTT"
  },
  VEICULO_AUTOMOTOR: {
    title: "Contratação de Veículo",
    description: "Operações com contratação apenas do veículo automotor de cargas conforme tabela B da RESOLUÇÃO Nº 6.067/2025.",
    formula: "Valor do Frete = (Distância × CCD) + CC",
    reference: "Tabela B - ANTT"
  },
  ALTO_DESEMPENHO: {
    title: "Alto Desempenho",
    description: "Transporte rodoviário de carga lotação de alto desempenho conforme tabela C da RESOLUÇÃO Nº 6.067/2025.",
    formula: "Valor do Frete = (Distância × CCD) + CC",
    reference: "Tabela C - ANTT"
  },
  VEICULO_ALTO_DESEMPENHO: {
    title: "Veículo Alto Desempenho",
    description: "Contratação de veículo automotor de alto desempenho conforme tabela D da RESOLUÇÃO Nº 6.067/2025.",
    formula: "Valor do Frete = (Distância × CCD) + CC",
    reference: "Tabela D - ANTT"
  }
};

const cargoTypeInfo = {
  GRANEL_SOLIDO: "Transporte de produtos a granel em estado sólido",
  GRANEL_LIQUIDO: "Transporte de produtos líquidos a granel",
  FRIGORIFICADA: "Transporte com controle de temperatura",
  CONTEINERIZADA: "Transporte em contêineres",
  CARGA_GERAL: "Transporte de carga geral diversificada",
  NEOGRANEL: "Transporte de neogranel",
  PERIGOSA_GRANEL_SOLIDO: "Transporte de produtos perigosos sólidos",
  PERIGOSA_GRANEL_LIQUIDO: "Transporte de produtos perigosos líquidos",
  PERIGOSA_FRIGORIFICADA: "Transporte refrigerado de produtos perigosos",
  PERIGOSA_CONTEINERIZADA: "Transporte conteinerizado de produtos perigosos",
  PERIGOSA_CARGA_GERAL: "Transporte de carga geral perigosa",
  GRANEL_PRESSURIZADA: "Transporte de granel pressurizado"
};

export default function CalculationInfo({ selectedCategory, selectedCargoType, selectedAxles }: CalculationInfoProps) {
  const categoryData = categoryInfo[selectedCategory as keyof typeof categoryInfo];

  return (
    <div className="space-y-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg text-blue-800">
              {categoryData?.title || "Informações do Cálculo"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {categoryData && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Base Legal:</span>
                </div>
                <p className="text-sm text-blue-700 pl-6">
                  {categoryData.description}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Fórmula:</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-blue-200 pl-6">
                  <code className="text-sm text-blue-800 font-mono">
                    {categoryData.formula}
                  </code>
                </div>
              </div>

              <Badge variant="outline" className="text-blue-600 border-blue-300">
                {categoryData.reference}
              </Badge>
            </>
          )}

          {selectedCargoType && (
            <div className="space-y-2 pt-2 border-t border-blue-200">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Tipo de Carga:</span>
              </div>
              <p className="text-sm text-blue-700 pl-6">
                {cargoTypeInfo[selectedCargoType as keyof typeof cargoTypeInfo]}
              </p>
            </div>
          )}

          {selectedAxles && (
            <div className="space-y-2 pt-2 border-t border-blue-200">
              <div className="text-sm">
                <span className="font-medium text-blue-800">Eixos Selecionados: </span>
                <span className="text-blue-700">{selectedAxles} eixos</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-800">
            📋 Legenda dos Coeficientes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-xs space-y-1">
            <div><strong className="text-green-800">CCD:</strong> <span className="text-green-700">Custo de Deslocamento (R$/km)</span></div>
            <div><strong className="text-green-800">CC:</strong> <span className="text-green-700">Carga e Descarga (R$ fixo)</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}