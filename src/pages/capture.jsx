import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { clientAPI } from "@/api/Client API";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Camera, Upload, X, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Capture() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      console.error("Erro na câmera:", err);
      setCameraError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
      setError("Erro na câmera: " + err.message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Desenhar o frame atual do vídeo
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const file = new File([blob], `capture-${Date.now()}.jpg`, { 
        type: 'image/jpeg',
        lastModified: Date.now()
      });
      handleFileSelect(file);
      stopCamera();
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Por favor, selecione apenas arquivos de imagem (JPEG, PNG, etc.).");
      return;
    }

    // Verificar tamanho do arquivo (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("O arquivo é muito grande. Tamanho máximo: 10MB.");
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.onerror = () => {
      setError("Erro ao ler o arquivo. Tente novamente.");
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const { file_url } = await clientAPI.integrations.Core.UploadFile({ file: selectedFile });
      
      const document = await clientAPI.entities.Document.create({
        title: selectedFile.name.replace(/\.[^/.]+$/, ""), // Remove extensão
        original_image_url: file_url,
        status: "completed",
        created_date: new Date().toISOString()
      });

      navigate(createPageUrl(`OCR?docId=${document.id}`));
    } catch (err) {
      console.error("Erro no upload:", err);
      setError("Erro ao fazer upload do arquivo. Verifique sua conexão e tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        stopCamera();
      }
    };
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Capturar Imagem</h1>
        <p className="text-gray-600 mb-8">Tire uma foto ou faça upload de uma imagem</p>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Selecione uma opção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!preview && !showCamera && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  size="lg"
                  onClick={startCamera}
                  className="h-32 bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                >
                  <div className="flex flex-col items-center gap-3">
                    <Camera className="w-8 h-8" />
                    <span className="text-lg">Tirar Foto</span>
                  </div>
                </Button>

                <div
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className="border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-0 flex flex-col items-center gap-3"
                  >
                    <Upload className="w-8 h-8" />
                    <span className="text-lg">Fazer Upload</span>
                    <span className="text-sm text-gray-500">ou arraste arquivos aqui</span>
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            )}

            {cameraError && (
              <Alert variant="destructive">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {showCamera && (
              <div className="space-y-4">
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                    <Button onClick={capturePhoto} className="bg-white text-gray-900 hover:bg-gray-100">
                      <Camera className="w-5 h-5 mr-2" />
                      Capturar Foto
                    </Button>
                    <Button variant="outline" onClick={stopCamera} className="text-white border-white hover:bg-white/10">
                      <X className="w-5 h-5 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 text-center">
                  Posicione o documento na câmera e clique em "Capturar Foto"
                </p>
              </div>
            )}

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-h-96 object-contain rounded-lg shadow-md bg-gray-100"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                        setError(null);
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white min-w-[200px]"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5 mr-2" />
                          Continuar para OCR
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="flex-1 min-w-[120px]"
                    >
                      <X className="w-5 h-5 mr-2" />
                      Cancelar
                    </Button>
                  </div>

                  {selectedFile && (
                    <div className="text-sm text-gray-600">
                      <p><strong>Arquivo:</strong> {selectedFile.name}</p>
                      <p><strong>Tamanho:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      <p><strong>Tipo:</strong> {selectedFile.type}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Dicas de uso */}
        {!preview && !showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Dicas para Melhor Captura</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Use boa iluminação</li>
                  <li>• Mantenha a câmera estável</li>
                  <li>• Enquadre todo o documento</li>
                  <li>• Evite reflexos e sombras</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-900 mb-2">📄 Formatos Suportados</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• JPEG, PNG, WebP</li>
                  <li>• Tamanho máximo: 10MB</li>
                  <li>• Resolução recomendada: 1080p+</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
