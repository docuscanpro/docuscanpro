import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileCheck, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function SignatureHistory() {
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['signed-documents'],
    queryFn: async () => {
      const docs = await base44.entities.Document.list('-created_date');
      return docs.filter(doc => doc.signature_url);
    },
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-12 text-center">
          <FileCheck className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum documento assinado
          </h3>
          <p className="text-gray-500">
            Assine seu primeiro documento para ver o histórico aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Histórico de Assinaturas ({documents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={doc.signature_url}
                    alt={doc.title}
                    className="w-full md:w-32 h-32 object-cover rounded"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(doc.created_date), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <FileCheck className="w-3 h-3 mr-1" />
                      Assinado
                    </Badge>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2">
                  <a
                    href={doc.signature_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Ver documento
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}