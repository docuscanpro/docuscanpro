import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Image, Download, Loader2, Upload, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ImageEditor from "../components/convert/ImageEditor";
import BatchConverter from "../components/convert/BatchConverter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Convert() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [targetFormat, setTargetFormat] = useState("png");
  const [convertedImages, setConvertedImages] = useState([]);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const formats = [
    { value: "png", label: "PNG - Imagem", type: "image" },
    { value: "jpg", label: "JPG - Imagem", type: "image" },
    { value: "webp", label: "WebP - Imagem", type: "image" },
    { value: "txt", label: "TXT - Texto", type: "document" },
    { value: "csv", label: "CSV - Planilha", type: "document" },
    { value: "html", label: "HTML - Página Web", type: "document" },
  ];

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      setError("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    setSelectedFiles(prev => [...prev, ...imageFiles]);
    setError(null);
    setConvertedImages([]);

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setConvertedImages(prev => prev.filter((_, i) => i !== index));
  };

  const convertImages = async () => {
    if (selectedFiles.length === 0) return;

    setConverting(true);
    setError(null);
    const converted = [];

    try {
      const selectedFormat = formats.find(f => f.value === targetFormat);
      
      if (selectedFormat.type === "image") {
        // Convert to image format
        for (let i = 0; i < previews.length; i++) {
          const img = new window.Image();
          img.src = previews[i];

          await new Promise((resolve) => {
            img.onload = resolve;
          });

          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          const mimeType = targetFormat === 'jpg' ? 'image/jpeg' : `image/${targetFormat}`;
          const quality = targetFormat === 'jpg' ? 0.9 : 1;

          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
          });

          const file = new File([blob], `converted-${i}.${targetFormat}`, { type: mimeType });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          converted.push(file_url);
        }
      } else {
        // Convert to document format
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const { file_url } = await base44.integrations.Core.UploadFile({ file });

          const text = await base44.integrations.Core.InvokeLLM({
            prompt: "Extraia todo o texto desta imagem. Retorne apenas o texto, sem formatação adicional.",
            file_urls: [file_url],
          });

          let convertedContent = text;
          let mimeType = "text/plain";

          if (targetFormat === "csv") {
            const lines = text.split('\n').filter(line => line.trim());
            convertedContent = lines.map(line => `"${line.replace(/"/g, '""')}"`).join('\n');
            mimeType = "text/csv";
          } else if (targetFormat === "html") {
            convertedContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${file.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <h1>${file.name}</h1>
    <div>${text.split('\n').map(line => `<p>${line}</p>`).join('\n    ')}</div>
</body>
</html>`;
            mimeType = "text/html";
          }

          const blob = new Blob([convertedContent], { type: mimeType });
          const convertedFile = new File([blob], `${file.name.split('.')[0]}.${targetFormat}`, { type: mimeType });
          const { file_url: converted_url } = await base44.integrations.Core.UploadFile({ file: convertedFile });
          converted.push(converted_url);
        }
      }

      setConvertedImages(converted);
    } catch (err) {
      setError("Erro ao converter arquivos. Tente novamente.");
      console.error(err);
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadAll = () => {
    convertedImages.forEach((url, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted-${index + 1}.${targetFormat}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 100);
    });
  };

  const handleImageEdited = (editedImageData, index) => {
    setPreviews(prev => {
      const newPreviews = [...prev];
      newPreviews[index] = editedImageData;
      return newPreviews;
    });
    
    // Convert base64 to File
    fetch(editedImageData)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], selectedFiles[index].name, { type: 'image/png' });
        setSelectedFiles(prev => {
          const newFiles = [...prev];
          newFiles[index] = file;
          return newFiles;
        });
      });
    
    setEditingIndex(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Converter Formato</h1>
          <p className="text-gray-600">Converta imagens para diferentes formatos - imagens ou documentos</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Conversão Individual</TabsTrigger>
            <TabsTrigger value="batch">Conversão em Lote</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-6 mt-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Selecionar Imagens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                  />
                  <Button
                    size="lg"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 bg-gradient-to-br from-orange-600 to-red-600"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-8 h-8" />
                      <span className="text-lg">Selecionar Imagens</span>
                      <span className="text-sm opacity-80">Múltiplas imagens suportadas</span>
                    </div>
                  </Button>
                </div>

                <AnimatePresence>
                  {previews.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {previews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-40 object-cover rounded-lg shadow-md"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                              <Button
                                size="icon"
                                variant="secondary"
                                onClick={() => setEditingIndex(index)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-3 items-end flex-wrap">
                        <div className="flex-1 min-w-[200px]">
                          <label className="text-sm font-medium mb-2 block">
                            Formato de Destino
                          </label>
                          <Select value={targetFormat} onValueChange={setTargetFormat}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {formats.map(format => (
                                <SelectItem key={format.value} value={format.value}>
                                  {format.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={convertImages}
                          disabled={converting}
                          className="bg-gradient-to-r from-orange-600 to-red-600"
                        >
                          {converting ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Convertendo...
                            </>
                          ) : (
                            <>
                              <Image className="w-4 h-4 mr-2" />
                              Converter {selectedFiles.length}
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {convertedImages.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium mb-4">
                        ✓ {convertedImages.length} {convertedImages.length === 1 ? 'arquivo convertido' : 'arquivos convertidos'}!
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {convertedImages.map((url, index) => (
                          <div key={index} className="relative">
                            {targetFormat === 'png' || targetFormat === 'jpg' || targetFormat === 'webp' ? (
                              <img
                                src={url}
                                alt={`Converted ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg shadow-md"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg shadow-md flex items-center justify-center">
                                <div className="text-center">
                                  <Image className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-600">{targetFormat.toUpperCase()}</p>
                                </div>
                              </div>
                            )}
                            <a
                              href={url}
                              download={`converted-${index + 1}.${targetFormat}`}
                              className="absolute bottom-2 right-2"
                            >
                              <Button size="icon" variant="secondary" className="h-8 w-8">
                                <Download className="w-4 h-4" />
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button onClick={handleDownloadAll} className="w-full">
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Todos os Arquivos
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="batch" className="mt-6">
            <BatchConverter />
          </TabsContent>
        </Tabs>

        {editingIndex !== null && (
          <ImageEditor
            imageData={previews[editingIndex]}
            onSave={(editedData) => handleImageEdited(editedData, editingIndex)}
            onCancel={() => setEditingIndex(null)}
          />
        )}
      </motion.div>
    </div>
  );
}