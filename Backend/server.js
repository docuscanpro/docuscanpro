const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { v4: uuidv4 } = require('uuid');
const Tesseract = require('tesseract.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static('public'));

// Configurações
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key');
const upload = multer({ dest: 'uploads/' });

// Banco de dados simulado
let documents = [];
let signatures = [];
let users = [];

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'DocuScan Pro API running' });
});

// Upload de arquivos
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    
    res.json({
      file_url: fileUrl,
      filename: file.originalname,
      size: file.size
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro no upload' });
  }
});

// Documentos
app.get('/api/documents', (req, res) => {
  res.json(documents.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
});

app.post('/api/documents', (req, res) => {
  const document = {
    id: uuidv4(),
    ...req.body,
    created_date: new Date().toISOString(),
    status: 'completed'
  };
  
  documents.push(document);
  res.json(document);
});

app.get('/api/documents/:id', (req, res) => {
  const document = documents.find(d => d.id === req.params.id);
  if (!document) return res.status(404).json({ error: 'Documento não encontrado' });
  res.json(document);
});

app.put('/api/documents/:id', (req, res) => {
  const index = documents.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Documento não encontrado' });
  
  documents[index] = { ...documents[index], ...req.body };
  res.json(documents[index]);
});

app.delete('/api/documents/:id', (req, res) => {
  documents = documents.filter(d => d.id !== req.params.id);
  res.json({ message: 'Documento deletado' });
});

// OCR
app.post('/api/ocr', upload.single('image'), async (req, res) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      req.file.path,
      'por+eng',
      { logger: m => console.log(m) }
    );

    res.json({ extracted_text: text.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Erro no OCR' });
  }
});

// Tradução
app.post('/api/translate', async (req, res) => {
  try {
    const { text, target_language } = req.body;
    
    // Simulação de tradução - em produção usar Gemini AI
    const translations = {
      'en': 'Translated text in English',
      'es': 'Texto traducido en español',
      'fr': 'Texte traduit en français'
    };
    
    const translatedText = translations[target_language] || text;
    
    res.json({ translated_text: translatedText });
  } catch (error) {
    res.status(500).json({ error: 'Erro na tradução' });
  }
});

// Assinaturas
app.get('/api/signatures', (req, res) => {
  res.json(signatures);
});

app.post('/api/signatures', (req, res) => {
  const signature = {
    id: uuidv4(),
    ...req.body,
    created_date: new Date().toISOString()
  };
  
  signatures.push(signature);
  res.json(signature);
});

// Aplicar assinatura
app.post('/api/sign-document', upload.single('document'), async (req, res) => {
  try {
    const { signature_data } = req.body;
    
    const docImage = await loadImage(req.file.path);
    const signImage = await loadImage(signature_data);
    
    const canvas = createCanvas(docImage.width, docImage.height);
    const ctx = canvas.getContext('2d');
    
    // Desenhar documento original
    ctx.drawImage(docImage, 0, 0);
    
    // Desenhar assinatura
    const signWidth = docImage.width * 0.3;
    const signHeight = (signImage.height / signImage.width) * signWidth;
    ctx.drawImage(
      signImage,
      docImage.width - signWidth - 20,
      docImage.height - signHeight - 20,
      signWidth,
      signHeight
    );
    
    // Adicionar timestamp
    ctx.font = '12px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText(
      `Assinado em: ${new Date().toLocaleString('pt-BR')}`,
      docImage.width - signWidth - 20,
      docImage.height - signHeight - 30
    );
    
    // Salvar imagem assinada
    const outputPath = `uploads/signed-${uuidv4()}.png`;
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    const signedUrl = `${req.protocol}://${req.get('host')}/${outputPath}`;
    
    res.json({ signed_url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao aplicar assinatura' });
  }
});

// Converter imagem
app.post('/api/convert', upload.single('image'), async (req, res) => {
  try {
    const { format } = req.body;
    const image = await loadImage(req.file.path);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    let mimeType, outputPath;
    
    switch (format) {
      case 'jpg':
        mimeType = 'image/jpeg';
        outputPath = `uploads/converted-${uuidv4()}.jpg`;
        break;
      case 'webp':
        mimeType = 'image/webp';
        outputPath = `uploads/converted-${uuidv4()}.webp`;
        break;
      default:
        mimeType = 'image/png';
        outputPath = `uploads/converted-${uuidv4()}.png`;
    }
    
    const buffer = canvas.toBuffer(mimeType);
    fs.writeFileSync(outputPath, buffer);
    
    const convertedUrl = `${req.protocol}://${req.get('host')}/${outputPath}`;
    
    res.json({ converted_url: convertedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Erro na conversão' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📁 Uploads disponíveis em: http://localhost:${PORT}/uploads`);
});
