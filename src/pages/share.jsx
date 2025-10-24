import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Share2, Mail, QrCode, Link as LinkIcon, Check } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import QRCode from "qrcode";

export default function Share() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const docId = urlParams.get('docId');

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: document } = useQuery({
    queryKey: ['document', docId],
    queryFn: async () => {
      if (!docId) return null;
      const docs = await base44.entities.Document.filter({ id: docId });
      return docs[0] || null;
    },
    enabled: !!docId,
  });

  const generateQRCode = async () => {
    if (!document?.original_image_url) return;

    try {
      const url = await QRCode.toDataURL(document.original_image_url, {
        width: 300,
        margin: 2,
      });
      setQrCodeUrl(url);
    } catch (err) {
      console.error("Erro ao gerar QR Code:", err);
    }
  };

  const handleSendEmail = async () => {
    if (!email || !document) return;

    setSending(true);
    setError(null);
    setSuccess(false);

    try {
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Compartilhamento: ${document.title}`,
        body: `${message}\n\nAcesse o documento: ${document.original_image_url}`
      });

      setSuccess(true);
      setEmail("");
      setMessage("");
    } catch (err) {
      setError("Erro ao enviar e-mail. Tente novamente.");
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!document?.original_image_url) return;

    await navigator.clipboard.writeText(document.original_image_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  React.useEffect(() => {
    if (document) {
      generateQRCode();
    }
  }, [document]);

  if (!document) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Alert>
          <AlertDescription>
            Nenhum documento selecionado para compartilhar.
          </AlertDescription>
        </Alert>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compartilhar Documento</h1>
          <p className="text-gray-600">Compartilhe seu documento por e-mail ou QR Code</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              ✓ E-mail enviado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <img
                src={document.original_image_url}
                alt={document.title}
                className="w-24 h-24 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold">{document.title}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(document.created_date).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Compartilhar por E-mail
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                E-mail do destinatário
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="exemplo@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Mensagem (opcional)
              </label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Adicione uma mensagem personalizada..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleSendEmail}
              disabled={!email || sending}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              {sending ? "Enviando..." : "Enviar por E-mail"}
            </Button>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qrCodeUrl && (
                <div className="flex flex-col items-center">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                  />
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Escaneie para acessar o documento
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5" />
                Link Direto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg break-all text-sm">
                {document.original_image_url}
              </div>

              <Button
                onClick={handleCopyLink}
                variant="outline"
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Link Copiado!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Copiar Link
                  </>
                )}
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ℹ️ Para WhatsApp e Telegram, copie o link e cole no app
              </p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}