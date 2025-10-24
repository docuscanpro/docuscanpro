import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages, Volume2, Download, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Translate() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(location.search);
  const docId = urlParams.get('docId');

  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("en");
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const { data: document } = useQuery({
    queryKey: ['document', docId],
    queryFn: async () => {
      if (!docId) return null;
      const docs = await base44.entities.Document.filter({ id: docId });
      return docs[0] || null;
    },
    enabled: !!docId,
  });

  useEffect(() => {
    if (document?.extracted_text) {
      setSourceText(document.extracted_text);
    }
  }, [document]);

  const translateMutation = useMutation({
    mutationFn: async () => {
      const languageNames = {
        'en': 'Inglês',
        'es': 'Espanhol',
        'fr': 'Francês',
        'de': 'Alemão',
        'it': 'Italiano',
        'pt': 'Português',
        'ja': 'Japonês',
        'ko': 'Coreano',
        'zh': 'Chinês',
        'ru': 'Russo',
        'ar': 'Árabe'
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Traduza o seguinte texto para ${languageNames[targetLanguage]}. Retorne apenas a tradução, sem explicações adicionais:\n\n${sourceText}`,
      });
      return result;
    },
    onSuccess: async (translation) => {
      setTranslatedText(translation);
      if (docId) {
        const currentTranslations = document?.translations || [];
        await base44.entities.Document.update(docId, {
          translations: [
            ...currentTranslations,
            {
              target_language: targetLanguage,
              translated_text: translation,
              created_at: new Date().toISOString()
            }
          ]
        });
        queryClient.invalidateQueries(['document', docId]);
      }
    },
    onError: (err) => {
      setError("Erro ao traduzir. Tente novamente.");
      console.error(err);
    }
  });

  const handleReadAloud = () => {
    if (!translatedText) return;

    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }

    const languageCodes = {
      'en': 'en-US',
      'es': 'es-ES',
      'fr': 'fr-FR',
      'de': 'de-DE',
      'it': 'it-IT',
      'pt': 'pt-BR',
      'ja': 'ja-JP',
      'ko': 'ko-KR',
      'zh': 'zh-CN',
      'ru': 'ru-RU',
      'ar': 'ar-SA'
    };

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = languageCodes[targetLanguage] || 'en-US';
    utterance.onend = () => {
      setIsReading(false);
      captureAudio();
    };
    
    window.speechSynthesis.speak(utterance);
    setIsReading(true);
  };

  const captureAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setTimeout(() => mediaRecorder.stop(), 5000);
    } catch (err) {
      console.error("Erro ao capturar áudio:", err);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioBlob) return;
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translation-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages = [
    { code: 'en', name: 'Inglês' },
    { code: 'es', name: 'Espanhol' },
    { code: 'fr', name: 'Francês' },
    { code: 'de', name: 'Alemão' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: 'Japonês' },
    { code: 'ko', name: 'Coreano' },
    { code: 'zh', name: 'Chinês' },
    { code: 'ru', name: 'Russo' },
    { code: 'ar', name: 'Árabe' }
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tradução com Áudio</h1>
          <p className="text-gray-600">Traduza textos e ouça em voz alta</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Texto Original
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Digite ou cole o texto para traduzir..."
              className="min-h-[200px] text-base"
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle>Tradução</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => translateMutation.mutate()}
                  disabled={!sourceText || translateMutation.isPending}
                  className="bg-gradient-to-r from-green-600 to-emerald-600"
                >
                  {translateMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Traduzindo...
                    </>
                  ) : (
                    <>
                      <Languages className="w-4 h-4 mr-2" />
                      Traduzir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={translatedText}
              readOnly
              placeholder="A tradução aparecerá aqui..."
              className="min-h-[200px] text-base bg-gray-50"
            />

            {translatedText && (
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleReadAloud}
                  variant={isReading ? "destructive" : "outline"}
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
                      Copiar
                    </>
                  )}
                </Button>

                {audioBlob && (
                  <Button onClick={handleDownloadAudio} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar Áudio
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}