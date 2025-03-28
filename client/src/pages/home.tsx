import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CarFront, Users, BarChart3, ClipboardList } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="text-center max-w-3xl mx-auto py-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Sistema de Gestão de Motoristas e Veículos</h1>
        <p className="text-slate-600">
          Gerencie de forma eficiente seus motoristas e frota de veículos com nosso sistema completo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Motoristas
            </CardTitle>
            <CardDescription>
              Gerenciar motoristas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Cadastre, edite e gerencie motoristas e seus documentos.
            </p>
            <Link href="/drivers">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CarFront className="h-5 w-5 text-primary" />
              Veículos
            </CardTitle>
            <CardDescription>
              Gerenciar veículos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Cadastre e gerencie os veículos da sua frota.
            </p>
            <Link href="/vehicles">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Dashboard
            </CardTitle>
            <CardDescription>
              Dados e estatísticas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Visualize métricas e indicadores de desempenho.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Gerar relatórios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              Gere relatórios personalizados para análise.
            </p>
            <Link href="/reports">
              <Button className="w-full">Acessar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
