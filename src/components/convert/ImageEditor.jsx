import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  RotateCw, 
  Crop, 
  Sun, 
  Droplet,
  Save,
  X,
  Maximize2
} from "lucide-react";
import { motion } from "framer-motion";

export default function ImageEditor({ imageData, onSave, onCancel }) {
  const canvasRef = useRef(null);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [originalImage, setOriginalImage] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setOriginalImage(img);
      drawImage(img);
    };
    img.src = imageData;
  }, [imageData]);

  useEffect(() => {
    if (originalImage) {
      drawImage(originalImage);
    }
  }, [rotation, brightness, contrast, saturation, originalImage]);

  const drawImage = (img) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    if (rotation % 180 === 0) {
      canvas.width = img.width;
      canvas.height = img.height;
    } else {
      canvas.width = img.height;
      canvas.height = img.width;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply rotation
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-img.width / 2, -img.height / 2);

    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const editedData = canvas.toDataURL('image/png');
    onSave(editedData);
  };

  const handleReset = () => {
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <Card 
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Editar Imagem
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-center bg-gray-100 rounded-lg p-4">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-96 object-contain"
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="w-4 h-4" />
                  Rotação
                </label>
                <Button variant="outline" size="sm" onClick={handleRotate}>
                  Girar 90°
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-2">{rotation}°</p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Sun className="w-4 h-4" />
                Brilho
              </label>
              <Slider
                value={[brightness]}
                onValueChange={([value]) => setBrightness(value)}
                min={0}
                max={200}
                step={1}
                className="mb-2"
              />
              <p className="text-xs text-gray-500">{brightness}%</p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Maximize2 className="w-4 h-4" />
                Contraste
              </label>
              <Slider
                value={[contrast]}
                onValueChange={([value]) => setContrast(value)}
                min={0}
                max={200}
                step={1}
                className="mb-2"
              />
              <p className="text-xs text-gray-500">{contrast}%</p>
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-3">
                <Droplet className="w-4 h-4" />
                Saturação
              </label>
              <Slider
                value={[saturation]}
                onValueChange={([value]) => setSaturation(value)}
                min={0}
                max={200}
                step={1}
                className="mb-2"
              />
              <p className="text-xs text-gray-500">{saturation}%</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Resetar
            </Button>
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}