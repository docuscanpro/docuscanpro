import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, User, Bell, Globe, Palette, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [settings, setSettings] = useState({
    defaultLanguage: 'pt-BR',
    defaultImageFormat: 'png',
    defaultDocFormat: 'txt',
    autoSaveDocuments: true,
    enableNotifications: true,
    theme: 'light',
    qualityLevel: 'high',
    autoOCR: false,
    defaultSignature: '',
  });

  useEffect(() => {
    if (user?.preferences) {
      setSettings(prev => ({ ...prev, ...user.preferences }));
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (newSettings) => {
      return await base44.auth.updateMe({
        preferences: newSettings
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err) => {
      setError("Erro ao salvar configurações. Tente novamente.");
      console.error(err);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateMutation.mutateAsync(settings);
    } finally {
      setSaving(false);
    }
  };

  const languages = [
    { value: 'pt-BR', label: 'Português (Brasil)' },
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
  ];

  const imageFormats = [
    { value: 'png', label: 'PNG' },
    { value: 'jpg', label: 'JPG' },
    { value: 'webp', label: 'WebP' },
  ];

  const docFormats = [
    { value: 'txt', label: 'TXT' },
    { value: 'csv', label: 'CSV' },
    { value: 'html', label: 'HTML' },
  ];

  const qualityLevels = [
    { value: 'low', label: 'Baixa (Rápida)' },
    { value: 'medium', label: 'Média (Balanceada)' },
    { value: 'high', label: 'Alta (Lenta)' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configurações</h1>
          <p className="text-gray-600">Personalize suas preferências e configurações do aplicativo</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✓ Configurações salvas com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Perfil do Usuário */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil do Usuário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input 
                value={user?.full_name || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Função</Label>
              <Input 
                value={user?.role === 'admin' ? 'Administrador' : 'Usuário'} 
                disabled 
                className="bg-gray-50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferências de Idioma */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Idioma e Região
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Idioma Padrão para Tradução</Label>
              <Select 
                value={settings.defaultLanguage} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultLanguage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferências de Conversão */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Conversão de Arquivos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Formato de Imagem Padrão</Label>
              <Select 
                value={settings.defaultImageFormat} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultImageFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {imageFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Formato de Documento Padrão</Label>
              <Select 
                value={settings.defaultDocFormat} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultDocFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {docFormats.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Qualidade de Conversão</Label>
              <Select 
                value={settings.qualityLevel} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, qualityLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {qualityLevels.map(level => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Preferências de Comportamento */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Comportamento do App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Salvar Documentos Automaticamente</Label>
                <p className="text-sm text-gray-500">
                  Salva todos os documentos processados automaticamente
                </p>
              </div>
              <Switch
                checked={settings.autoSaveDocuments}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSaveDocuments: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>OCR Automático</Label>
                <p className="text-sm text-gray-500">
                  Extrair texto automaticamente ao capturar imagem
                </p>
              </div>
              <Switch
                checked={settings.autoOCR}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoOCR: checked }))}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notificações</Label>
                <p className="text-sm text-gray-500">
                  Receber notificações sobre processos concluídos
                </p>
              </div>
              <Switch
                checked={settings.enableNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Aparência
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tema</Label>
              <Select 
                value={settings.theme} 
                onValueChange={(value) => setSettings(prev => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Claro</SelectItem>
                  <SelectItem value="dark">Escuro</SelectItem>
                  <SelectItem value="auto">Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <div className="flex gap-3 pt-4">
          <Button 
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}