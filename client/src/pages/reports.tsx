import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, BarChart } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Relatórios</h2>
          <p className="text-sm text-slate-500">Gere relatórios do sistema</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Relatório de Motoristas</CardTitle>
                <CardDescription>Lista todos os motoristas cadastrados</CardDescription>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Exibe uma lista completa de todos os motoristas com suas informações pessoais e quantidade de veículos.
            </p>
            <Button className="w-full flex items-center justify-center gap-1">
              <Download className="h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Relatório de Veículos</CardTitle>
                <CardDescription>Lista todos os veículos cadastrados</CardDescription>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Exibe uma lista completa de todos os veículos cadastrados e seus respectivos motoristas.
            </p>
            <Button className="w-full flex items-center justify-center gap-1">
              <Download className="h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
                <CardDescription>Resumo estatístico do sistema</CardDescription>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <BarChart className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Exibe estatísticas sobre motoristas, veículos e outras métricas importantes.
            </p>
            <Button className="w-full flex items-center justify-center gap-1">
              <Download className="h-4 w-4" /> Gerar Relatório
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Módulo de Relatórios</h3>
        <p className="text-slate-600">
          Este módulo permite gerar relatórios diversos do sistema.
          <br />
          Selecione o tipo de relatório desejado e clique em "Gerar Relatório".
        </p>
      </div>
    </div>
  );
}
