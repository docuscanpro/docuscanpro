import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, Save, Trash2, Upload, Download, X, FileCheck, History, Package } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SignatureCanvas from "../components/signature/SignatureCanvas";
import BatchSigner from "../components/signature/BatchSigner";
import SignatureHistory from "../components/signature/SignatureHistory";

export default function Sign() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [signatureName, setSignatureName] = useState("");
  const [error, setError] = useState(null);
  const [currentSignature, setCurrentSignature] = useState(null);
  const fileInputRef = useRef(null);

  const { data: signatures = [] } = useQuery({
    queryKey: ['signatures'],
    queryFn: () => base44.entities.Signature.list('-created_date'),
  });

  const saveMutation = useMutation({
    mutationFn: async (signatureData) => {
      return await base44.entities.Signature.create({
        name: signatureName || `Assinatura ${new Date().toLocaleDateString()}`,
        signature_data: signatureData,
        is_default: signatures.length === 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['signatures']);
      setSignatureName("");
      setCurrentSignature(null);
      setError(null);
    },
    onError: () => {
      setError("Erro ao salvar assinatura.");
    }
  });

  const handleFileSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const applySignatureToDocument = async () => {
    if (!selectedFile || !signatures[0]) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const img = new window.Image();
    img.src = preview;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const signImg = new window.Image();
    signImg.src = signatures[0].signature_data;

    await new Promise((resolve) => {
      signImg.onload = resolve;
    });

    const signWidth = img.width * 0.3;
    const signHeight = (signImg.height / signImg.width) * signWidth;
    ctx.drawImage(
      signImg,
      img.width - signWidth - 20,
      img.height - signHeight - 20,
      signWidth,
      signHeight
    );

    // Add timestamp
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(
      `Assinado em: ${new Date().toLocaleString('pt-BR')}`,
      img.width - signWidth - 20,
      img.height - signHeight - 30
    );

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'signed-document.png', { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Save to documents
      await base44.entities.Document.create({
        title: `${selectedFile.name} (Assinado)`,
        original_image_url: preview,
        signature_url: file_url,
        status: "completed"
      });

      const a = document.createElement('a');
      a.href = file_url;
      a.download = 'documento-assinado.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      queryClient.invalidateQueries(['documents']);
    }, 'image/png');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Assinatura Digital</h1>
          <p className="text-gray-600">Crie e aplique assinaturas digitais com timestamp</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create">
              <PenTool className="w-4 h-4 mr-2" />
              Criar
            </TabsTrigger>
            <TabsTrigger value="sign">
              <FileCheck className="w-4 h-4 mr-2" />
              Assinar
            </TabsTrigger>
            <TabsTrigger value="batch">
              <Package className="w-4 h-4 mr-2" />
              Em Lote
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="w-4 h-4 mr-2" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5" />
                  Criar Nova Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Nome da Assinatura
                  </label>
                  <Input
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    placeholder="Ex: Assinatura Oficial"
                  />
                </div>

                <SignatureCanvas
                  onSave={(signatureData) => {
                    setCurrentSignature(signatureData);
                    saveMutation.mutate(signatureData);
                  }}
                />

                {signatures.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Minhas Assinaturas ({signatures.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {signatures.map((sig) => (
                        <div
                          key={sig.id}
                          className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{sig.name}</p>
                            {sig.is_default && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Padrão
                              </span>
                            )}
                          </div>
                          <img
                            src={sig.signature_data}
                            alt={sig.name}
                            className="w-full h-20 object-contain border rounded bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Criada em: {new Date(sig.created_date).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sign" className="mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Assinar Documento Individual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!preview && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileSelect(e.target.files[0])}
                      className="hidden"
                    />
                    <Button
                      size="lg"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full h-32"
                      variant="outline"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="w-8 h-8" />
                        <span className="text-lg">Selecionar Documento</span>
                      </div>
                    </Button>
                  </div>
                )}

                {preview && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <img
                        src={preview}
                        alt="Document"
                        className="w-full rounded-lg shadow-md"
                      />
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreview(null);
                          setSelectedFile(null);
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>

                    <Button
                      onClick={applySignatureToDocument}
                      disabled={signatures.length === 0}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Aplicar Assinatura e Baixar
                    </Button>

                    {signatures.length === 0 && (
                      <p className="text-sm text-gray-500 text-center">
                        Crie uma assinatura primeiro para assinar documentos
                      </p>
                    )}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="mt-6">
            <BatchSigner signatures={signatures} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <SignatureHistory />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}