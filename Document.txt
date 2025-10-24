{
  "name": "Document",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Nome do documento"
    },
    "original_image_url": {
      "type": "string",
      "description": "URL da imagem original"
    },
    "extracted_text": {
      "type": "string",
      "description": "Texto extraído via OCR"
    },
    "detected_language": {
      "type": "string",
      "description": "Idioma detectado no texto"
    },
    "translations": {
      "type": "array",
      "description": "Traduções realizadas",
      "items": {
        "type": "object",
        "properties": {
          "target_language": {
            "type": "string"
          },
          "translated_text": {
            "type": "string"
          },
          "audio_url": {
            "type": "string"
          },
          "created_at": {
            "type": "string",
            "format": "date-time"
          }
        }
      }
    },
    "converted_formats": {
      "type": "array",
      "description": "Formatos convertidos",
      "items": {
        "type": "object",
        "properties": {
          "format": {
            "type": "string"
          },
          "url": {
            "type": "string"
          }
        }
      }
    },
    "signature_url": {
      "type": "string",
      "description": "URL da imagem com assinatura"
    },
    "status": {
      "type": "string",
      "enum": [
        "processing",
        "completed",
        "error"
      ],
      "default": "processing"
    }
  },
  "required": [
    "title"
  ]
}