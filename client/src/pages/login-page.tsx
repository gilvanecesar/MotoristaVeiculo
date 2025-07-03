import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { FaWhatsapp } from "react-icons/fa";

// Importando a logo da empresa
import logoQueroFretes from "@assets/QUEROFRETES BOLINHA.png";

// Esquema de validação para login
const loginSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  
  const { toast } = useToast();
  const { loginMutation } = useAuth();
  const [_, navigate] = useLocation();

  // Formulário de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Função para solicitar redefinição de senha
  const handlePasswordReset = async () => {
    if (!resetEmail) return;
    
    setIsRequestingReset(true);
    
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: resetEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao solicitar redefinição de senha');
      }
      
      toast({
        title: "Email enviado",
        description: "Verifique sua caixa de entrada para redefinir sua senha",
      });
      
      setForgotPasswordOpen(false);
      setResetEmail("");
    } catch (error) {
      console.error('Erro ao solicitar redefinição de senha:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Falha ao solicitar redefinição de senha',
        variant: "destructive",
      });
    } finally {
      setIsRequestingReset(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      {/* Formulário de Login Simples */}
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Entre com seu e-mail e senha para acessar a plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="seu@email.com" 
                          type="email"
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="••••••" 
                          type="password"
                          className="h-11"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full h-11 bg-teal-600 hover:bg-teal-700"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              variant="link"
              onClick={() => setForgotPasswordOpen(true)}
              className="text-teal-600 hover:text-teal-700"
            >
              Esqueci minha senha
            </Button>
          </CardFooter>
        </Card>

        {/* Botão de Suporte WhatsApp */}
        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="w-full max-w-sm mx-auto bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
            onClick={() => window.open("https://wa.me/5531971559484", "_blank")}
          >
            <FaWhatsapp className="mr-2 h-4 w-4" />
            Falar com Suporte
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        © 2025 QUERO FRETES. Todos os direitos reservados.
      </div>

      {/* Dialog para redefinir senha */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite seu e-mail para receber as instruções de redefinição de senha.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-email">E-mail</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotPasswordOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePasswordReset} disabled={isRequestingReset || !resetEmail}>
              {isRequestingReset ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}