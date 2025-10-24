import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import {
  Camera,
  FileText,
  Languages,
  Image,
  PenTool,
  FolderOpen,
  ArrowRight,
  Sparkles,
  TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 10),
  });

  const features = [
    {
      title: "Capturar Imagem",
      description: "Tire uma foto ou faça upload de imagem",
      icon: Camera,
      gradient: "from-blue-500 to-cyan-500",
      url: createPageUrl("Capture"),
    },
    {
      title: "Extrair Texto (OCR)",
      description: "Extraia texto de imagens automaticamente",
      icon: FileText,
      gradient: "from-purple-500 to-pink-500",
      url: createPageUrl("OCR"),
    },
    {
      title: "Traduzir",
      description: "Traduza textos com áudio em tempo real",
      icon: Languages,
      gradient: "from-green-500 to-emerald-500",
      url: createPageUrl("Translate"),
    },
    {
      title: "Converter Formato",
      description: "Converta imagens entre diferentes formatos",
      icon: Image,
      gradient: "from-orange-500 to-red-500",
      url: createPageUrl("Convert"),
    },
    {
      title: "Assinar Documento",
      description: "Adicione assinatura digital aos documentos",
      icon: PenTool,
      gradient: "from-indigo-500 to-blue-500",
      url: createPageUrl("Sign"),
    },
    {
      title: "Meus Documentos",
      description: "Acesse seu histórico de documentos",
      icon: FolderOpen,
      gradient: "from-pink-500 to-rose-500",
      url: createPageUrl("MyDocuments"),
    },
  ];

  const stats = [
    {
      label: "Total de Documentos",
      value: documents.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Processados Hoje",
      value: documents.filter(doc => {
        const today = new Date().toDateString();
        return new Date(doc.created_date).toDateString() === today;
      }).length,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      label: "Com Tradução",
      value: documents.filter(doc => doc.translations?.length > 0).length,
      icon: Languages,
      color: "text-purple-600",
      bg: "bg-purple-100",
    },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full translate-y-48 -translate-x-48" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Bem-vindo</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            DocuScan Pro
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-8">
            Seu assistente completo para processamento inteligente de documentos e imagens
          </p>
          <Link to={createPageUrl("Capture")}>
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg">
              <Camera className="w-5 h-5 mr-2" />
              Começar Agora
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Funcionalidades</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={feature.url}>
                <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${feature.gradient}`} />
                  <CardHeader>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{feature.description}</p>
                    <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                      Acessar
                      <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Documentos Recentes</h2>
            <Link to={createPageUrl("MyDocuments")}>
              <Button variant="outline">
                Ver Todos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.slice(0, 3).map((doc) => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  {doc.original_image_url && (
                    <img
                      src={doc.original_image_url}
                      alt={doc.title}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <h3 className="font-semibold mb-1">{doc.title}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}