import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json({ limit: '1mb' }));

interface RecommendRequestBody {
  student: {
    id: string;
    name: string;
    group: string;
    attendance_pct: number;
    late_count: number;
    tasks_total: number;
    tasks_missed: number;
    grade_prev: number;
    grade_now: number;
  };
  riskScore: number;
  riskLevelLabel: string;
  components: Array<{
    key: string;
    label: string;
    contribution: number;
    sharePct: number;
    substitutedText: string;
  }>;
  largestComponent: {
    key: string;
    label: string;
    contribution: number;
    sharePct: number;
  };
}

app.post('/api/recommend', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return res.status(500).json({
      error:
        "GEMINI_API_KEY sozlanmagan. Iltimos, Settings > Secrets bo'limida API kalitini tekshiring.",
    });
  }

  const body = req.body as Partial<RecommendRequestBody>;
  if (!body || !body.student || !Array.isArray(body.components) || !body.largestComponent) {
    return res.status(400).json({
      error: "Talaba ma'lumotlari yoki R komponentlari to'liq yuborilmadi.",
    });
  }

  const { student, riskScore, riskLevelLabel, components, largestComponent } = body;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const componentLines = components
    .map(
      (c) =>
        `- ${c.label}: ${c.contribution.toFixed(1)} ball (${c.sharePct.toFixed(1)}% ulush) [${c.substitutedText}]`
    )
    .join('\n');

  const prompt = `Siz universitet akademik maslahatchisisiz. Quyidagi talaba ko'rsatkichlari va xavf balli (R) komponentlari asosida faqat o'zbek tilida (lotin yozuvida) tavsiya tuzing.

TALABA MA'LUMOTLARI:
- ID: ${student.id}
- Ism-familiya: ${student.name}
- Guruh: ${student.group}
- Davomat: ${student.attendance_pct}%
- Kechikishlar soni: ${student.late_count} marta
- Jami topshiriqlar: ${student.tasks_total} ta
- Bajarilmagan topshiriqlar: ${student.tasks_missed} ta
- Avvalgi baho: ${student.grade_prev}
- Joriy baho: ${student.grade_now}

XAVF BALLI (R): ${Number(riskScore).toFixed(1)} (${riskLevelLabel})

R KOMPONENTLARI:
${componentLines}

ENG KATTA KOMPONENT: ${largestComponent.label} (${largestComponent.contribution.toFixed(1)} ball, jami xavfning ${largestComponent.sharePct.toFixed(1)}% qismi).

QAT'IY QOIDALAR:
1. Faqat yuqorida berilgan raqamlar va faktlarga tayaning. Berilmagan fan nomlari, sanalar, kasalliklar yoki qo'shimcha ma'lumotlarni HECH QACHON to'qib chiqarmang.
2. "mainCause": Aynan 1 ta aniq gapda asosiy sababni yozing va unda eng katta komponent ("${largestComponent.label}") hamda uning aniq ko'rsatkichini tilga oling.
3. "twoWeekPlan": 2 haftaga mo'ljallangan aniq, amaliy 3 bosqichli reja (3 ta elementli massiv). Har bir bosqich berilgan muammoli ko'rsatkichlarni yaxshilashga qaratilgan bo'lsin.
4. "studentMessage": Talabaning o'ziga (ismi bilan murojaat qilib) yo'llanadigan qisqa, qo'llab-quvvatlovchi va xushmuomala xabar (2-3 gap).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          "Siz aniq raqamlarga tayanadigan universitet akademik monitoring tizimi maslahatchisisiz. Javobni faqat o'zbek tilida (lotin alifbosida) va belgilangan JSON formatida bering. Hech qanday uydirma ma'lumot qo'shmang.",
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainCause: {
              type: Type.STRING,
              description:
                "Eng katta R komponentiga tayangan holda asosiy sababni ifodalovchi 1 ta gap (o'zbek tilida).",
            },
            twoWeekPlan: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2 haftalik 3 bosqichli amaliy harakat rejasi (3 ta qadam).",
            },
            studentMessage: {
              type: Type.STRING,
              description:
                "Talabaga yuboriladigan qisqa, hurmatli va dalda beruvchi xabar (o'zbek tilida).",
            },
          },
          required: ['mainCause', 'twoWeekPlan', 'studentMessage'],
        },
      },
    });

    const rawText = (response.text ?? '').trim();
    if (!rawText) {
      return res.status(502).json({
        error: "AI modelidan bo'sh javob qaytdi. Iltimos, qayta urinib ko'ring.",
      });
    }

    const parsed = JSON.parse(rawText);
    return res.json({
      mainCause: String(parsed.mainCause || ''),
      twoWeekPlan: Array.isArray(parsed.twoWeekPlan)
        ? parsed.twoWeekPlan.slice(0, 3).map(String)
        : [],
      studentMessage: String(parsed.studentMessage || ''),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Gemini API xatosi:', message);
    return res.status(502).json({
      error: `AI tavsiyasini olishda xatolik yuz berdi: ${message}`,
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartUni Monitor server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
