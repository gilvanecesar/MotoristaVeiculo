import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save, CreditCard, UserCog, AlertTriangle, Settings, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  
  // Verificar se o usuário possui uma assinatura ativa
  const hasSubscription = user?.stripeSubscriptionId && user?.subscriptionActive;

  // Consulta para buscar detalhes da assinatura (data de expiração, etc.)
  const { data: subscriptionInfo, isLoading: isLoadingSubscription } = useQuery({
    queryKey: ["/api/user/subscription-info"],
    queryFn: async () => {
      if (!hasSubscription) return null;
      const res = await apiRequest("GET", "/api/user/subscription-info");
      if (!res.ok) throw new Error("Falha ao carregar informações da assinatura");
      return res.json();
    },
    enabled: !!hasSubscription,
  });

  // Mutation para cancelar a assinatura
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/cancel-subscription");
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Falha ao cancelar a assinatura");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura foi cancelada com sucesso. Você terá acesso até o final do período contratado.",
      });
      setConfirmCancelOpen(false);
      // Atualizar os dados do usuário
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro ao cancelar",
        description: error.message || "Houve um problema ao cancelar sua assinatura. Tente novamente.",
      });
    },
  });

  // Formatação de valores
  const formatSubscriptionDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Não disponível";
    try {
      const date = new Date(dateStr);
      return format(date, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  const getSubscriptionTypeName = () => {
    if (!user?.subscriptionType) return "Não disponível";
    
    switch (user.subscriptionType) {
      case "monthly":
        return "Mensal";
      case "yearly":
        return "Anual";
      case "trial":
        return "Período de teste (7 dias)";
      case "driver_free":
        return "Acesso gratuito (Motorista)";
      default:
        return user.subscriptionType;
    }
  };

  // Handler para cancelar assinatura
  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate();
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col max-w-4xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Conta</h1>
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary underline">Voltar para o início</Link>
        </div>

        <Tabs defaultValue="subscription" className="w-full">
          <TabsList className={`grid w-full ${user?.profileType === 'admin' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>Assinatura</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2">
              <UserCog className="h-4 w-4" />
              <span>Conta</span>
            </TabsTrigger>
            {user?.profileType === 'admin' && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Administração</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="subscription" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Assinatura</CardTitle>
                <CardDescription>
                  Veja os detalhes de sua assinatura e gerencie seu plano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingSubscription ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-medium">Status da Assinatura</h3>
                      <div>
                        {user?.subscriptionActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Ativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Inativa
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-sm font-medium">Tipo de Plano</h3>
                      <p className="text-sm text-muted-foreground">{getSubscriptionTypeName()}</p>
                    </div>

                    {user?.subscriptionExpiresAt && (
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-medium">Expira em</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatSubscriptionDate(user.subscriptionExpiresAt)}
                        </p>
                      </div>
                    )}

                    {subscriptionInfo?.trialEnd && (
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-medium">Período de Teste até</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatSubscriptionDate(subscriptionInfo.trialEnd)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {hasSubscription && (
                  <div className="mt-6 p-4 border rounded-md bg-amber-50 border-amber-200">
                    <div className="flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                      <div>
                        <h4 className="text-sm font-medium text-amber-800">Cancelamento de Assinatura</h4>
                        <p className="text-sm text-amber-700 mt-1">
                          Ao cancelar sua assinatura, você continuará tendo acesso ao sistema até o final do período contratado. Após essa data, seu acesso será limitado.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-0 sm:space-y-0">
                {hasSubscription ? (
                  <Button
                    variant="destructive"
                    onClick={() => setConfirmCancelOpen(true)}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      "Cancelar Assinatura"
                    )}
                  </Button>
                ) : (
                  <Button variant="default" className="w-full sm:w-auto" asChild>
                    <Link href="/auth">Adquirir Assinatura</Link>
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Conta</CardTitle>
                <CardDescription>
                  Veja e atualize suas informações pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Nome</h3>
                    <p className="text-sm text-muted-foreground">{user?.name || "Não informado"}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">E-mail</h3>
                    <p className="text-sm text-muted-foreground">{user?.email || "Não informado"}</p>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Tipo de Perfil</h3>
                    <p className="text-sm text-muted-foreground">
                      {user?.profileType === "admin" && "Administrador"}
                      {user?.profileType === "driver" && "Motorista"}
                      {user?.profileType === "shipper" && "Embarcador"}
                      {user?.profileType === "agent" && "Transportadora/Agente"}
                      {!user?.profileType && "Não definido"}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium">Status da Conta</h3>
                    <div>
                      {user?.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inativa
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Alterar Senha</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {user?.profileType === 'admin' && (
            <TabsContent value="admin" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ferramentas de Administração</CardTitle>
                  <CardDescription>
                    Acesse rapidamente as principais ferramentas administrativas do sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button 
                      onClick={() => navigate("/admin/email")} 
                      variant="outline" 
                      className="flex items-center gap-2 h-auto p-4 justify-start"
                    >
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Configurar Email</div>
                        <div className="text-sm text-muted-foreground">Configurações SMTP e testes de email</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => navigate("/admin/finance")} 
                      variant="outline" 
                      className="flex items-center gap-2 h-auto p-4 justify-start"
                    >
                      <CreditCard className="h-5 w-5 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Gestão Financeira</div>
                        <div className="text-sm text-muted-foreground">Assinaturas e pagamentos</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => navigate("/admin")} 
                      variant="outline" 
                      className="flex items-center gap-2 h-auto p-4 justify-start"
                    >
                      <UserCog className="h-5 w-5 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium">Painel Admin</div>
                        <div className="text-sm text-muted-foreground">Gerenciar usuários e sistema</div>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={() => navigate("/settings")} 
                      variant="outline" 
                      className="flex items-center gap-2 h-auto p-4 justify-start"
                      disabled
                    >
                      <Settings className="h-5 w-5 text-gray-400" />
                      <div className="text-left">
                        <div className="font-medium">Configurações Gerais</div>
                        <div className="text-sm text-muted-foreground">Você já está aqui</div>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Diálogo de confirmação de cancelamento */}
      <Dialog open={confirmCancelOpen} onOpenChange={setConfirmCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso ao sistema até o final do período contratado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:justify-between sm:space-x-0 sm:space-y-0">
            <Button variant="outline" onClick={() => setConfirmCancelOpen(false)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelSubscription} disabled={cancelSubscriptionMutation.isPending}>
              {cancelSubscriptionMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
