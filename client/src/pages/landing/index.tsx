import React from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronRight, Truck, Users, BarChart3, CheckCircle2, Globe, Shield, Clock, CreditCard, Menu } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import logoPath from "@assets/QUEROFRETES BOLINHA.png";
import "./landing.css";
import { TestimonialSection } from "./TestimonialSection";
import { StatsSection } from "./StatsSection";
import DashboardPreview from "@/assets/dashboard-preview";

export default function LandingPage() {
  const [_, setLocation] = useLocation();

  const goToLogin = () => {
    setLocation("/auth");
  };
  
  const goToRegister = () => {
    setLocation("/auth");
  };

  const features = [
    {
      icon: <Truck className="w-10 h-10 text-primary" />,
      title: "Gestão Completa de Fretes",
      description: "Controle total sobre todos os fretes, desde a origem até o destino final, com informações detalhadas sobre carga, veículo e pagamento."
    },
    {
      icon: <Users className="w-10 h-10 text-primary" />,
      title: "Cadastro de Clientes e Motoristas",
      description: "Mantenha uma base de dados completa de clientes e motoristas, com todos os documentos e informações necessárias."
    },
    {
      icon: <Globe className="w-10 h-10 text-primary" />,
      title: "Compartilhamento via WhatsApp",
      description: "Compartilhe fretes diretamente pelo WhatsApp com um só clique, facilitando a comunicação com motoristas e parceiros."
    },
    {
      icon: <BarChart3 className="w-10 h-10 text-primary" />,
      title: "Relatórios Detalhados",
      description: "Acompanhe o desempenho da sua operação com relatórios detalhados sobre fretes, clientes e motoristas."
    }
  ];

  const benefits = [
    {
      icon: <CheckCircle2 className="w-6 h-6 text-primary" />,
      title: "Aumento de Produtividade",
      description: "Reduza o tempo gasto com processos manuais e aumente a produtividade da sua equipe."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Segurança de Dados",
      description: "Seus dados estão seguros e protegidos em nossa plataforma, com backups regulares."
    },
    {
      icon: <Clock className="w-6 h-6 text-primary" />,
      title: "Disponibilidade 24/7",
      description: "Acesse suas informações a qualquer hora e em qualquer lugar, de qualquer dispositivo."
    },
    {
      icon: <CreditCard className="w-6 h-6 text-primary" />,
      title: "Planos Acessíveis",
      description: "Escolha entre planos mensais ou anuais, com descontos especiais para pagamentos antecipados."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <img src={logoPath} alt="QUERO FRETES Logo" className="h-10 w-10" />
            <span className="font-bold text-xl">QUERO FRETES</span>
          </div>
          <div className="hidden md:flex space-x-4">
            <Button
              variant="outline"
              className="border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:border-primary"
              onClick={goToLogin}
            >
              Entrar
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={goToLogin}>
              Registrar
            </Button>
          </div>
          <div className="md:hidden">
            <Button size="sm" variant="ghost" className="text-white" onClick={goToLogin}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-10 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 mb-10 lg:mb-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center lg:text-left">
                <span className="text-primary">Simplifique</span> sua gestão de fretes
              </h1>
              <p className="text-lg sm:text-xl mb-8 text-slate-300 text-center lg:text-left">
                A plataforma completa para transportadoras, embarcadores e agentes de carga gerenciarem suas operações com eficiência e praticidade.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="bg-primary hover:bg-primary/90 text-white px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg" onClick={goToLogin}>
                  Começar Agora <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
                <Button variant="outline" className="border-slate-300 text-slate-900 bg-white hover:bg-slate-100 hover:border-primary px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg">
                  Saiba Mais
                </Button>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start text-center lg:text-left">
                <p className="text-slate-300 mb-2 sm:mb-0 sm:mr-4">Teste grátis por 7 dias</p>
                <span className="flex items-center text-primary">
                  <CheckCircle2 className="h-5 w-5 mr-2" /> Sem necessidade de cartão de crédito
                </span>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative w-full max-w-md lg:max-w-lg">
                <div className="absolute inset-0 bg-primary rounded-full blur-3xl opacity-20"></div>
                <div className="relative z-10 rounded-lg shadow-2xl border border-slate-700 overflow-hidden">
                  <DashboardPreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Recursos Avançados</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              O QUERO FRETES oferece todas as ferramentas necessárias para otimizar 
              suas operações de transporte e logística.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg border border-slate-200 hover:border-primary transition-all">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg" onClick={goToLogin}>
              Experimente Grátis por 7 dias
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Pricing Section */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900">Planos Simples e Transparentes</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Escolha o plano que melhor se adapta às necessidades da sua empresa.
            </p>
          </div>

          <div className="flex flex-col md:grid md:grid-cols-2 lg:flex lg:flex-row gap-6 md:gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 flex-1 overflow-hidden">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4 text-slate-900">Motoristas</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">Grátis</span>
                </div>
                <p className="text-slate-600 mb-6">
                  Ideal para motoristas autônomos que buscam fretes disponíveis.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Visualização de fretes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Contato direto com embarcadores</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Cadastro de veículos</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={goToLogin}>
                  Registrar-se
                </Button>
              </div>
            </div>

            {/* Monthly Plan */}
            <div className="bg-white rounded-lg shadow-lg border-2 border-primary flex-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-white py-1 px-4 text-sm font-bold">
                MAIS POPULAR
              </div>
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4 text-slate-900">Mensal</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">R$ 99,90</span>
                  <span className="text-slate-600">/mês</span>
                </div>
                <p className="text-slate-600 mb-6">
                  Ideal para empresas que buscam gerenciar fretes e operações.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Cadastro ilimitado de fretes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Gestão de clientes e motoristas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Compartilhamento via WhatsApp</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Relatórios básicos</span>
                  </li>
                </ul>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={goToLogin}>
                  Começar Agora
                </Button>
              </div>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-lg shadow-lg border border-slate-200 flex-1 overflow-hidden md:col-span-2 lg:col-span-1">
              <div className="p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4 text-slate-900">Anual</h3>
                <div className="mb-4">
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">R$ 960,00</span>
                  <span className="text-slate-600">/ano</span>
                </div>
                <p className="text-slate-600 mb-6">
                  <span className="text-green-600 font-bold">Economize 20%</span> com o plano anual.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Todas as funcionalidades do plano mensal</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Relatórios avançados</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Suporte prioritário</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-800">Acesso a novas funcionalidades</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={goToLogin}>
                  Escolher Anual
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 text-slate-900">Por que escolher o QUERO FRETES?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Conheça os benefícios que nossa plataforma pode trazer para o seu negócio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex">
                <div className="mr-4">{benefit.icon}</div>
                <div>
                  <h3 className="text-lg font-bold mb-2 text-slate-900">{benefit.title}</h3>
                  <p className="text-slate-600">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <TestimonialSection />
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/90 to-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para simplificar sua gestão de fretes?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Comece hoje mesmo e tenha 7 dias gratuitos para explorar todas as funcionalidades do QUERO FRETES.
          </p>
          <Button
            className="bg-white text-primary hover:bg-slate-100 px-8 py-6 text-lg"
            onClick={goToLogin}
          >
            Criar Conta Grátis
          </Button>
          <p className="mt-4 text-sm">Não é necessário cartão de crédito</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-slate-900">Entre em contato</h2>
            <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto">
              Tem dúvidas sobre o QUERO FRETES? Nossa equipe está pronta para ajudar!
            </p>
          </div>
        
          <div className="flex flex-col lg:flex-row gap-8 md:gap-12 max-w-5xl mx-auto">
            <div className="lg:w-1/2">
              <div className="flex flex-col h-full justify-between">
                <div>
                  <div className="flex justify-center lg:justify-start mb-8">
                    <a 
                      href="https://wa.me/5531971559484" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto"
                    >
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 flex items-center justify-center w-full sm:w-auto"
                      >
                        <FaWhatsapp className="mr-2 h-5 w-5" /> Fale Conosco pelo WhatsApp
                      </Button>
                    </a>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <p className="flex items-center text-slate-800">
                      <span className="font-bold min-w-24 inline-block">Email:</span> 
                      <span>contato@querofretes.com.br</span>
                    </p>
                    <p className="flex items-center text-slate-800">
                      <span className="font-bold min-w-24 inline-block">Telefone:</span> 
                      <span>(31) 97155-9484</span>
                    </p>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-md border border-slate-200 mt-auto hidden lg:block">
                  <h4 className="font-bold text-lg mb-3 text-slate-900">Horário de Atendimento</h4>
                  <ul className="space-y-2">
                    <li className="flex justify-between">
                      <span className="text-slate-700">Segunda-Sexta:</span>
                      <span className="text-slate-900 font-medium">08:00 - 18:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-700">Sábado:</span>
                      <span className="text-slate-900 font-medium">09:00 - 13:00</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-slate-700">Domingo:</span>
                      <span className="text-slate-900 font-medium">Fechado</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="lg:w-1/2">
              <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-slate-200">
                <h3 className="text-xl font-bold mb-6 text-slate-900">Envie uma mensagem</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Nome</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-slate-300 rounded-md"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Email</label>
                    <input
                      type="email"
                      className="w-full p-3 border border-slate-300 rounded-md"
                      placeholder="seu.email@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-slate-700">Mensagem</label>
                    <textarea
                      className="w-full p-3 border border-slate-300 rounded-md h-32"
                      placeholder="Como podemos ajudar?"
                    ></textarea>
                  </div>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white py-3">
                    Enviar Mensagem
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-10 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0 text-center md:text-left">
              <div className="flex items-center space-x-2 mb-4 justify-center md:justify-start">
                <img src={logoPath} alt="QUERO FRETES Logo" className="h-10 w-10" />
                <span className="font-bold text-xl text-white">QUERO FRETES</span>
              </div>
              <p className="text-slate-400 max-w-md mx-auto md:mx-0">
                A plataforma completa para simplificar a gestão de fretes e transporte, conectando embarcadores, transportadoras e motoristas.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="text-center sm:text-left">
                <h4 className="font-bold text-lg mb-4 text-white">Plataforma</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Home</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Recursos</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Planos</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Contato</a></li>
                </ul>
              </div>
              
              <div className="text-center sm:text-left">
                <h4 className="font-bold text-lg mb-4 text-white">Legal</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Privacidade</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Cookies</a></li>
                </ul>
              </div>
              
              <div className="col-span-2 sm:col-span-1 text-center sm:text-left">
                <h4 className="font-bold text-lg mb-4 text-white">Contato & Redes</h4>
                <ul className="space-y-2">
                  <li>
                    <a 
                      href="https://wa.me/5531971559484" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-green-500 transition-colors inline-flex items-center"
                    >
                      <FaWhatsapp className="mr-2" /> WhatsApp
                    </a>
                  </li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Facebook</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Instagram</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-white transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-6 md:pt-8 mt-6 md:mt-8">
            <p className="text-center text-slate-400 text-sm md:text-base">
              &copy; {new Date().getFullYear()} QUERO FRETES. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}