import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import UsersManagement from "./users-management";
import DataManagement from "./data-management";

export default function AdminPage() {
  const [tab, setTab] = useState("users");
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Verificar se o usuário é um administrador
  if (user?.profileType !== "admin") {
    navigate("/home");
    toast({
      title: "Acesso restrito",
      description: "Você não tem permissão para acessar esta página",
      variant: "destructive",
    });
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Painel do Administrador</h2>
        <Button onClick={() => navigate("/admin/finance")} className="flex items-center gap-2">
          <Icons.dollarSign className="h-4 w-4" />
          Gestão Financeira
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">
            <Icons.user className="mr-2 h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="data-management">
            <Icons.database className="mr-2 h-4 w-4" />
            Gerenciamento de Dados
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Icons.activity className="mr-2 h-4 w-4" />
            Logs do Sistema
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Icons.settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <UsersManagement />
        </TabsContent>

        <TabsContent value="data-management" className="space-y-4">
          <DataManagement />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Visualize os registros de atividades do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded h-[400px] p-4 overflow-auto bg-slate-50 dark:bg-slate-900">
                <p className="text-sm text-muted-foreground">
                  Ainda não há logs disponíveis.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Limpar Logs</Button>
              <Button variant="outline">Exportar</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Gerencie as configurações gerais do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Configuração de Email</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure e teste o serviço de envio de emails do sistema.
                  </p>
                  <Button onClick={() => navigate("/admin/email")}>
                    <Icons.mail className="mr-2 h-4 w-4" />
                    Configurar Email
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Backup do Banco de Dados</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie um backup completo de todos os dados do sistema.
                  </p>
                  <Button>
                    <Icons.download className="mr-2 h-4 w-4" />
                    Gerar Backup
                  </Button>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Restaurar Sistema</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Restaure o sistema a partir de um backup existente.
                  </p>
                  <Button variant="outline">
                    <Icons.upload className="mr-2 h-4 w-4" />
                    Restaurar Backup
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}