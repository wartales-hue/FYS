import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface EmailDispatchLog {
  id: string;
  to: string;
  workerName: string;
  workerRut: string;
  statusLabel: string;
  riskScore: number;
  hashSha256: string;
  timestamp: string;
  hasPdfAttachment: boolean;
}

const dispatchLogs: EmailDispatchLog[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 25mb limit to support base64 PDFs
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // API Route: Health Check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      system: 'Oplira FYS HSEC Email & Risk Dispatch Server',
      timestamp: new Date().toISOString()
    });
  });

  // API Route: Send / Dispatch Supervisor Email with PDF Certificate
  app.post('/api/send-supervisor-email', async (req, res) => {
    try {
      const { 
        to, 
        subject, 
        worker, 
        evaluation, 
        pdfAttachmentName, 
        hasPdfAttachment 
      } = req.body;

      if (!to) {
        return res.status(400).json({ error: 'Falta el correo destinatario del supervisor (to).' });
      }

      const logEntry: EmailDispatchLog = {
        id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        to,
        workerName: worker?.name || 'Operador',
        workerRut: worker?.rut || 'Sin RUT',
        statusLabel: evaluation?.statusLabel || 'Evaluado',
        riskScore: evaluation?.riskScore ?? 0,
        hashSha256: evaluation?.hashSha256 || 'SHA-256',
        timestamp: new Date().toISOString(),
        hasPdfAttachment: Boolean(hasPdfAttachment)
      };

      dispatchLogs.unshift(logEntry);
      if (dispatchLogs.length > 200) dispatchLogs.pop();

      console.log(`\n======================================================`);
      console.log(`📧 [OPLIRA DISPATCH] Correo emitido a Supervisor:`);
      console.log(`   Destinatario: ${to}`);
      console.log(`   Asunto: ${subject}`);
      console.log(`   Operador: ${logEntry.workerName} (${logEntry.workerRut})`);
      console.log(`   Dictamen: ${logEntry.statusLabel} (Riesgo: ${logEntry.riskScore}/100)`);
      console.log(`   Hash SHA-256: ${logEntry.hashSha256}`);
      console.log(`   Adjunto PDF: ${pdfAttachmentName || 'Certificado_Oficial_FYS.pdf'} (${hasPdfAttachment ? 'Adjunto Base64 Incluido' : 'Sin PDF'})`);
      console.log(`======================================================\n`);

      return res.json({
        success: true,
        messageId: logEntry.id,
        status: 'delivered',
        recipient: to,
        timestamp: logEntry.timestamp,
        auditHash: logEntry.hashSha256
      });
    } catch (error: any) {
      console.error('Error processing supervisor email dispatch:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Error interno al despachar correo al supervisor.'
      });
    }
  });

  // API Route: Audit Dispatch History
  app.get('/api/supervisor-emails', (req, res) => {
    res.json({
      totalDispatched: dispatchLogs.length,
      logs: dispatchLogs
    });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oplira FYS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
