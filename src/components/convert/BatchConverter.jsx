import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileText, Loader2, CheckCircle2, Image } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BatchConverter() {
  const [files, setFiles] = useState([]);
  const [targetFormat, setTargetFormat] = useState("png");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const formats = [
    { value: "png", label: "PNG - Imagem", type: "image" },
    { value: "jpg", label: "JPG - Imagem", type: "image" },
    { value: "webp", label: "WebP - Imagem", type: "image" },
    { value: "txt", label: "TXT - Texto", type: "document" },
    { value: "csv", label: "CSV - Planilha", type: "document" },
    { value: "html", label: "HTML - Página Web", type: "document" },
  ];

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setResults([]);
    setError(null);
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setProcessing(true);
    setError(null);
    setProgress(0);
    const processedResults = [];

    try {
      const selectedFormat = formats.find(f => f.value === targetFormat);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(((i + 1) / files.length) * 100);

        if (selectedFormat.type === "image") {
          // Convert to image format
          const reader = new FileReader();
          const preview = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });

          const img = new window.Image();
          await new Promise((resolve) => {
            img.onload = resolve;
            img.src = preview;
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

          const convertedFile = new File([blob], `${file.name.split('.')[0]}.${targetFormat}`, { type: mimeType });
          const { file_url } = await base44.integrations.Core.UploadFile({ file: convertedFile });

          processedResults.push({
            original: file.name,
            url: file_url,
            format: targetFormat
          });
        } else {
          // Convert to document format
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

          processedResults.push({
            original: file.name,
            url: converted_url,
            format: targetFormat
          });
        }
      }

      setResults(processedResults);
    } catch (err) {
      setError("Erro ao processar arquivos. Tente novamente.");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadAll = () => {
    results.forEach((result, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = result.url;
        a.download = result.original.replace(/\.[^/.]+$/, `.${result.format}`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }, index * 100);
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Conversão em Lote</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
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
            <p className="text-xs text-gray-500 mt-2">
              ℹ️ Para DOCX, PPTX e Excel, ative as funções backend nas configurações
            </p>
          </div>

          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="batch-upload"
            />
            <label htmlFor="batch-upload">
              <Button
                asChild
                size="lg"
                className="w-full h-24 cursor-pointer"
                variant="outline"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-6 h-6" />
                  <span>Selecionar Múltiplas Imagens</span>
                  {files.length > 0 && (
                    <span className="text-xs text-gray-500">
                      {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
                    </span>
                  )}
                </div>
              </Button>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="flex-1 truncate">{file.name}</span>
                    {results[index] && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  </div>
                ))}
              </div>

              {processing && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processando arquivos...
                  </div>
                  <Progress value={progress} />
                  <p className="text-xs text-gray-500 text-center">
                    {Math.round(progress)}% concluído
                  </p>
                </div>
              )}

              <Button
                onClick={processFiles}
                disabled={processing || files.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Converter {files.length} {files.length === 1 ? 'Arquivo' : 'Arquivos'}
                  </>
                )}
              </Button>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ {results.length} {results.length === 1 ? 'arquivo convertido' : 'arquivos convertidos'}!
              </p>
              <Button onClick={downloadAll} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Todos os Arquivos
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
