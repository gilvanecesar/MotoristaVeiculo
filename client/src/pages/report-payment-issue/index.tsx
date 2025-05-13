import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Link } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, CheckCircle } from 'lucide-react';

// Esquema de validação
const reportSchema = z.object({
  issueType: z.string().min(1, 'Selecione o tipo de problema'),
  description: z.string().min(10, 'Descreva o problema em pelo menos 10 caracteres'),
  contactEmail: z.string().email('Informe um email válido').optional(),
  contactPhone: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

export default function ReportPaymentIssuePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  
  // Configurar formulário com valores padrão
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      issueType: '',
      description: '',
      contactEmail: user?.email || '',
      contactPhone: '',
    },
  });
  
  // Função para envio do formulário
  async function onSubmit(values: ReportFormValues) {
    try {
      // Aqui você normalmente enviaria os dados para a API
      console.log('Dados do formulário:', values);
      
      // Simular envio bem-sucedido após 1 segundo
      setTimeout(() => {
        setSubmitted(true);
        toast({
          title: 'Problema reportado com sucesso',
          description: 'Entraremos em contato em breve para resolver seu problema.',
        });
      }, 1000);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: 'Erro ao reportar problema',
        description: 'Ocorreu um erro ao enviar seu relatório. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  }
  
  // Se o formulário foi enviado, mostrar mensagem de sucesso
  if (submitted) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-2xl font-medium mb-2">Problema Reportado</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Seu problema foi registrado com sucesso. Nossa equipe analisará a situação e entrará em contato em breve.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline">
                  <Link href="/subscribe">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para Assinaturas
                  </Link>
                </Button>
                <Button asChild>
                  <Link href="/home">
                    Ir para o Dashboard
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2">Reportar Problema</h1>
          <p className="text-muted-foreground">Informe problemas relacionados a pagamentos ou assinaturas</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            asChild
          >
            <Link href="/subscribe">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Reportar Problema de Pagamento</CardTitle>
          <CardDescription>
            Preencha o formulário abaixo para reportar problemas com pagamentos ou assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="issueType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Problema</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de problema" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="payment_failed">Falha no pagamento</SelectItem>
                        <SelectItem value="double_charge">Cobrança duplicada</SelectItem>
                        <SelectItem value="subscription_issue">Problema com assinatura</SelectItem>
                        <SelectItem value="invoice_missing">Fatura não recebida</SelectItem>
                        <SelectItem value="access_after_payment">Acesso não liberado após pagamento</SelectItem>
                        <SelectItem value="other">Outro problema</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Selecione a opção que melhor descreve seu problema
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição do Problema</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhadamente o problema que está enfrentando..."
                        className="resize-none h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça o máximo de detalhes possível, como datas, valores e mensagens de erro.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email para Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Email para retorno (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone para Contato</FormLabel>
                      <FormControl>
                        <Input placeholder="(11) 98765-4321" {...field} />
                      </FormControl>
                      <FormDescription>
                        Telefone para retorno (opcional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div>
                <Button type="submit" className="w-full">
                  Enviar Relatório
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-sm text-muted-foreground">
            Para problemas urgentes, entre em contato diretamente pelo WhatsApp: (11) 9XXXX-XXXX
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}