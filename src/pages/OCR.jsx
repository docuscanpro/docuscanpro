import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { clientAPI } from "@/api/Client API";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Volume2, Copy, ArrowRight, Loader2, Check, Download } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function OCR() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(location.search);
  const docId = urlParams.get('docId');

  const [extractedText, setExtractedText] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: document, isLoading: documentLoading } = useQuery({
    queryKey: ['document', docId],
    queryFn: async () => {
      if (!docId) return null;
      try {
        const docs = await clientAPI.entities.Document.filter({ id: docId });
        return docs[0] || null;
      } catch (err) {
        console.error("Erro ao carregar documento:", err);
        setError("Erro ao carregar documento. Tente novamente.");
        return null;
      }
    },
    enabled: !!docId,
  });

  const extractMutation = useMutation({
    mutationFn: async () => {
      if (!document?.original_image_url) {
        throw new Error("URL da imagem não disponível");
      }

      setIsProcessing(true);
      try {
        const result = await clientAPI.integrations.Core.InvokeLLM({
          prompt: `Extraia todo o texto visível desta imagem. Mantenha a formatação e estrutura originais. Retorne apenas o texto extraído, sem comentários adicionais. Se não houver texto legível, retorne "Nenhum texto detectado na imagem".`,
          file_urls: [document.original_image_url],
        });
        return result;
      } catch (err) {
        console.error("Erro na extração OCR:", err);
        throw new Error("Falha na extração de texto. Verifique a imagem e tente novamente.");
      } finally {
        setIsProcessing(false);
      }
    },
    onSuccess: async (text) => {
      setExtractedText(text);
      setError(null);
      
      if (docId) {
        try {
          await clientAPI.entities.Document.update(docId, {
            extracted_text: text,
            detected_language: "pt-BR",
            status: "completed"
          });
          queryClient.invalidateQueries(['document', docId]);
        } catch (err) {
          console.error("Erro ao salvar texto extraído:", err);
          // Não mostra erro para o usuário, pois o texto foi extraído com sucesso
        }
      }
    },
    onError: (err) => {
      setError(err.message || "Erro ao extrair texto. Tente novamente.");
      setIsProcessing(false);
    }
  });

  useEffect(() => {
    if (document?.extracted_text) {
      setExtractedText(document.extracted_text);
    }
  }, [document]);

  const handleReadAloud = () => {
    if (!extractedText || extractedText === "Nenhum texto detectado na imagem") return;

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    // Verificar suporte à síntese de voz
    if (!window.speechSynthesis) {
      setError("Seu navegador não suporta síntese de voz.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => {
      setIsReading(false);
      setError("Erro na reprodução de áudio.");
    };
    
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const handleCopy = async () => {
    if (!extractedText) return;

    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError("Erro ao copiar texto. Tente novamente.");
    }
  };

  const handleDownload = () => {
    if (!extractedText) return;

    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `texto-extraido-${document?.title || 'documento'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRetry = () => {
    setError(null);
    if (document) {
      extractMutation.mutate();
    }
  };

  if (!document && !documentLoading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Alert>
          <AlertDescription>
            Nenhum documento selecionado. Por favor, capture uma imagem primeiro.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate(createPageUrl("Capture"))}>
          Capturar Imagem
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Extração de Texto (OCR)</h1>
          <p className="text-gray-600">Extraia texto da imagem automaticamente</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              <div className="flex justify-between items-center">
                <span>{error}</span>
                {error.includes("extrair") && (
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    Tentar Novamente
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {document && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Imagem Original</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <img
                  src={document.original_image_url}
                  alt={document.title}
                  className="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-100"
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {document.title}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Texto Extraído
                {extractedText && (
                  <span className="text-sm font-normal text-green-600 ml-2">
                    ✓ {extractedText.split(/\s+/).length} palavras
                  </span>
                )}
              </CardTitle>
              
              {!extractedText && document && (
                <Button
                  onClick={() => extractMutation.mutate()}
                  disabled={extractMutation.isPending || isProcessing}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  {extractMutation.isPending || isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Extraindo...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Extrair Texto
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder={
                extractMutation.isPending || isProcessing 
                  ? "Extraindo texto da imagem..." 
                  : "O texto extraído aparecerá aqui..."
              }
              className="min-h-[300px] text-base resize-none font-mono text-sm"
              disabled={extractMutation.isPending || isProcessing}
            />

            {extractedText && (
              <div className="flex flex-wrap gap-3 justify-between">
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleReadAloud}
                    variant={isReading ? "destructive" : "outline"}
                    disabled={!extractedText || extractedText === "Nenhum texto detectado na imagem"}
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    {isReading ? "Parar Leitura" : "Ler em Voz Alta"}
                  </Button>

                  <Button onClick={handleCopy} variant="outline">
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copiar Texto
                      </>
                    )}
                  </Button>

                  <Button onClick={handleDownload} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar TXT
                  </Button>
                </div>

                <Button
                  onClick={() => navigate(createPageUrl(`Translate?docId=${docId}`))}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                  disabled={!extractedText || extractedText === "Nenhum texto detectado na imagem"}
                >
                  Traduzir Texto
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {(extractMutation.isPending || isProcessing) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando imagem... Isso pode levar alguns segundos.
              </div>
            )}

            {extractedText === "Nenhum texto detectado na imagem" && (
              <Alert variant="destructive">
                <AlertDescription>
                  Não foi possível detectar texto na imagem. Tente com uma imagem mais nítida ou melhor iluminada.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Estatísticas do texto */}
        {extractedText && extractedText !== "Nenhum texto detectado na imagem" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {extractedText.split(/\s+/).length}
                </div>
                <div className="text-sm text-gray-600">Palavras</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">
                  {extractedText.length}
                </div>
                <div className="text-sm text-gray-600">Caracteres</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {extractedText.split('.').length - 1}
                </div>
                <div className="text-sm text-gray-600">Sentenças</div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.ceil(extractedText.split(/\s+/).length / 200)}
                </div>
                <div className="text-sm text-gray-600">Min de Leitura</div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
