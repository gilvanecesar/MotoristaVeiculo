import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Megaphone, 
  Plus, 
  Pencil, 
  Trash2, 
  MessageSquare, 
  ToggleLeft, 
  ToggleRight,
  Shuffle,
  ArrowLeft,
  Eye,
  Calendar
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CampaignMessage {
  id: number;
  campaignId: number;
  title: string | null;
  body: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

interface Campaign {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  randomize: boolean;
  displayOrder: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  messages: CampaignMessage[];
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClientLocal = useQueryClient();
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isNewCampaignOpen, setIsNewCampaignOpen] = useState(false);
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [isEditMessageOpen, setIsEditMessageOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<CampaignMessage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "campaign" | "message"; id: number; name: string } | null>(null);
  
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    randomize: true,
  });
  
  const [newMessage, setNewMessage] = useState({
    title: "",
    body: "",
  });

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/admin/campaigns"],
  });

  const toggleCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/campaigns/${id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Status alterado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof newCampaign) => {
      const res = await apiRequest("POST", "/api/admin/campaigns", data);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setIsNewCampaignOpen(false);
      setNewCampaign({ name: "", description: "", randomize: true });
      toast({ title: "Campanha criada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao criar campanha", variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setDeleteTarget(null);
      setSelectedCampaign(null);
      toast({ title: "Campanha excluída com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir campanha", variant: "destructive" });
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Campaign> }) => {
      const res = await apiRequest("PUT", `/api/admin/campaigns/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Campanha atualizada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar campanha", variant: "destructive" });
    },
  });

  const createMessageMutation = useMutation({
    mutationFn: async ({ campaignId, data }: { campaignId: number; data: typeof newMessage }) => {
      const res = await apiRequest("POST", `/api/admin/campaigns/${campaignId}/messages`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setIsNewMessageOpen(false);
      setNewMessage({ title: "", body: "" });
      toast({ title: "Mensagem criada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao criar mensagem", variant: "destructive" });
    },
  });

  const updateMessageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CampaignMessage> }) => {
      const res = await apiRequest("PUT", `/api/admin/campaigns/messages/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setIsEditMessageOpen(false);
      setEditingMessage(null);
      toast({ title: "Mensagem atualizada com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar mensagem", variant: "destructive" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/campaigns/messages/${id}`);
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      setDeleteTarget(null);
      toast({ title: "Mensagem excluída com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao excluir mensagem", variant: "destructive" });
    },
  });

  const toggleMessageMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/campaigns/messages/${id}/toggle`);
      return res.json();
    },
    onSuccess: () => {
      queryClientLocal.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      toast({ title: "Status da mensagem alterado" });
    },
    onError: () => {
      toast({ title: "Erro ao alterar status", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (selectedCampaign) {
    const campaign = campaigns.find(c => c.id === selectedCampaign.id) || selectedCampaign;
    
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(null)} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              {campaign.name}
            </h1>
            <p className="text-gray-600">{campaign.description}</p>
          </div>
          <Badge variant={campaign.status === "active" ? "default" : "secondary"} data-testid={`badge-status-${campaign.id}`}>
            {campaign.status === "active" ? "Ativa" : "Inativa"}
          </Badge>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="h-5 w-5" />
                    Configurações
                  </CardTitle>
                  <CardDescription>Controle como as mensagens são exibidas</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <Switch
                    id="randomize"
                    checked={campaign.randomize}
                    onCheckedChange={(checked) => {
                      updateCampaignMutation.mutate({ id: campaign.id, data: { randomize: checked } });
                    }}
                    data-testid="switch-randomize"
                  />
                  <Label htmlFor="randomize" className="text-sm">
                    Randomizar mensagens
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    id="active"
                    checked={campaign.status === "active"}
                    onCheckedChange={() => toggleCampaignMutation.mutate(campaign.id)}
                    data-testid="switch-campaign-active"
                  />
                  <Label htmlFor="active" className="text-sm">
                    Campanha ativa
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Mensagens ({campaign.messages?.length || 0})
                  </CardTitle>
                  <CardDescription>Mensagens promocionais exibidas no compartilhamento WhatsApp</CardDescription>
                </div>
                <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-new-message">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Mensagem
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Nova Mensagem</DialogTitle>
                      <DialogDescription>
                        Crie uma nova mensagem promocional para esta campanha
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="msg-title">Título (opcional)</Label>
                        <Input
                          id="msg-title"
                          placeholder="Ex: Promoção Cooper Tires"
                          value={newMessage.title}
                          onChange={(e) => setNewMessage({ ...newMessage, title: e.target.value })}
                          data-testid="input-message-title"
                        />
                      </div>
                      <div>
                        <Label htmlFor="msg-body">Texto da Mensagem *</Label>
                        <Textarea
                          id="msg-body"
                          placeholder="Texto que aparecerá no WhatsApp..."
                          rows={8}
                          value={newMessage.body}
                          onChange={(e) => setNewMessage({ ...newMessage, body: e.target.value })}
                          data-testid="input-message-body"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Use emojis e formatação WhatsApp: *negrito*, _itálico_
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
                        Cancelar
                      </Button>
                      <Button 
                        onClick={() => createMessageMutation.mutate({ campaignId: campaign.id, data: newMessage })}
                        disabled={!newMessage.body.trim() || createMessageMutation.isPending}
                        data-testid="button-save-message"
                      >
                        Salvar Mensagem
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {campaign.messages?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma mensagem cadastrada</p>
                  <p className="text-sm">Clique em "Nova Mensagem" para adicionar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaign.messages?.map((message, index) => (
                    <div 
                      key={message.id} 
                      className={`border rounded-lg p-4 ${message.isActive ? 'bg-white' : 'bg-gray-50 opacity-70'}`}
                      data-testid={`card-message-${message.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                            {message.title && (
                              <span className="font-medium text-sm">{message.title}</span>
                            )}
                            <Badge variant={message.isActive ? "default" : "secondary"} className="text-xs">
                              {message.isActive ? "Ativa" : "Inativa"}
                            </Badge>
                          </div>
                          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                            {message.body}
                          </pre>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleMessageMutation.mutate(message.id)}
                            title={message.isActive ? "Desativar" : "Ativar"}
                            data-testid={`button-toggle-message-${message.id}`}
                          >
                            {message.isActive ? (
                              <ToggleRight className="h-4 w-4 text-green-600" />
                            ) : (
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingMessage(message);
                              setIsEditMessageOpen(true);
                            }}
                            data-testid={`button-edit-message-${message.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget({ type: "message", id: message.id, name: message.title || `Mensagem #${index + 1}` })}
                            data-testid={`button-delete-message-${message.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setDeleteTarget({ type: "campaign", id: campaign.id, name: campaign.name })}
              data-testid="button-delete-campaign"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Campanha
            </Button>
          </div>
        </div>

        <Dialog open={isEditMessageOpen} onOpenChange={setIsEditMessageOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Mensagem</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-msg-title">Título (opcional)</Label>
                <Input
                  id="edit-msg-title"
                  value={editingMessage?.title || ""}
                  onChange={(e) => setEditingMessage(prev => prev ? { ...prev, title: e.target.value } : null)}
                  data-testid="input-edit-message-title"
                />
              </div>
              <div>
                <Label htmlFor="edit-msg-body">Texto da Mensagem</Label>
                <Textarea
                  id="edit-msg-body"
                  rows={8}
                  value={editingMessage?.body || ""}
                  onChange={(e) => setEditingMessage(prev => prev ? { ...prev, body: e.target.value } : null)}
                  data-testid="input-edit-message-body"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMessageOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (editingMessage) {
                    updateMessageMutation.mutate({
                      id: editingMessage.id,
                      data: { title: editingMessage.title, body: editingMessage.body }
                    });
                  }
                }}
                disabled={!editingMessage?.body?.trim() || updateMessageMutation.isPending}
                data-testid="button-update-message"
              >
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteTarget?.type === "campaign") {
                    deleteCampaignMutation.mutate(deleteTarget.id);
                  } else if (deleteTarget?.type === "message") {
                    deleteMessageMutation.mutate(deleteTarget.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-confirm-delete"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Campanhas
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie as campanhas promocionais do compartilhamento WhatsApp
          </p>
        </div>
        <Dialog open={isNewCampaignOpen} onOpenChange={setIsNewCampaignOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
              <DialogDescription>
                Crie uma nova campanha promocional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Nome da Campanha *</Label>
                <Input
                  id="campaign-name"
                  placeholder="Ex: Cooper Tires - Linha Work 2025"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  data-testid="input-campaign-name"
                />
              </div>
              <div>
                <Label htmlFor="campaign-desc">Descrição</Label>
                <Textarea
                  id="campaign-desc"
                  placeholder="Descrição da campanha..."
                  value={newCampaign.description}
                  onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })}
                  data-testid="input-campaign-description"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="new-randomize"
                  checked={newCampaign.randomize}
                  onCheckedChange={(checked) => setNewCampaign({ ...newCampaign, randomize: checked })}
                  data-testid="switch-new-randomize"
                />
                <Label htmlFor="new-randomize">Randomizar mensagens</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewCampaignOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => createCampaignMutation.mutate(newCampaign)}
                disabled={!newCampaign.name.trim() || createCampaignMutation.isPending}
                data-testid="button-save-campaign"
              >
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma campanha cadastrada</h3>
            <p className="text-gray-500 mb-4">
              Crie sua primeira campanha para começar a exibir mensagens promocionais no WhatsApp
            </p>
            <Button onClick={() => setIsNewCampaignOpen(true)} data-testid="button-create-first-campaign">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card 
              key={campaign.id} 
              className={`cursor-pointer hover:shadow-md transition-shadow ${campaign.status === "inactive" ? "opacity-70" : ""}`}
              onClick={() => setSelectedCampaign(campaign)}
              data-testid={`card-campaign-${campaign.id}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${campaign.status === "active" ? "bg-green-100" : "bg-gray-100"}`}>
                      <Megaphone className={`h-6 w-6 ${campaign.status === "active" ? "text-green-600" : "text-gray-400"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{campaign.name}</h3>
                      <p className="text-sm text-gray-500">{campaign.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant={campaign.status === "active" ? "default" : "secondary"}>
                          {campaign.status === "active" ? "Ativa" : "Inativa"}
                        </Badge>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {campaign.messages?.length || 0} mensagens
                        </span>
                        {campaign.randomize && (
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Shuffle className="h-3 w-3" />
                            Randomizada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCampaignMutation.mutate(campaign.id);
                      }}
                      title={campaign.status === "active" ? "Desativar" : "Ativar"}
                      data-testid={`button-toggle-campaign-${campaign.id}`}
                    >
                      {campaign.status === "active" ? (
                        <ToggleRight className="h-5 w-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-gray-400" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampaign(campaign);
                      }}
                      data-testid={`button-view-campaign-${campaign.id}`}
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deleteTarget?.name}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === "campaign") {
                  deleteCampaignMutation.mutate(deleteTarget.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
