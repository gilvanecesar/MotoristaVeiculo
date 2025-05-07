import React from "react";
import { Star } from "lucide-react";

interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

const Testimonial: React.FC<TestimonialProps> = ({ quote, author, role, company, rating }) => {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-200 testimonial-card">
      <div className="flex mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-5 w-5 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"}`}
          />
        ))}
      </div>
      <p className="text-slate-700 mb-6 italic">{quote}</p>
      <div>
        <p className="font-bold text-slate-900">{author}</p>
        <p className="text-slate-700 text-sm">
          {role}, {company}
        </p>
      </div>
    </div>
  );
};

export const TestimonialSection: React.FC = () => {
  const testimonials = [
    {
      quote:
        "O QUERO FRETES transformou completamente a gestão dos nossos fretes. Economizamos tempo e recursos, além de termos um controle muito maior sobre nossas operações de transporte.",
      author: "Carlos Silva",
      role: "Gerente de Logística",
      company: "Transportadora Silva",
      rating: 5,
    },
    {
      quote:
        "Como motorista autônomo, o QUERO FRETES me deu acesso a muito mais oportunidades de frete. A facilidade de contato direto com os embarcadores mudou minha forma de trabalhar.",
      author: "João Oliveira",
      role: "Motorista Autônomo",
      company: "Transportes JO",
      rating: 5,
    },
    {
      quote:
        "A função de compartilhamento via WhatsApp nos permite enviar fretes para nossa rede de motoristas parceiros em segundos. Isso agilizou muito nosso processo de contratação de fretes.",
      author: "Maria Santos",
      role: "Coordenadora de Operações",
      company: "Express Transportes",
      rating: 4,
    },
  ];

  return (
    <section className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">O que nossos clientes dizem</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Veja como o QUERO FRETES tem ajudado empresas e profissionais do setor de transporte a otimizar suas operações.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Testimonial key={index} {...testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
};