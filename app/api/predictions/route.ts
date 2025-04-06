// app/api/predictions/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET() {
  const assets = ['Gold', 'Bonds', 'Stocks', 'RealEstate', 'Crypto'];

  const prompt = `다음 자산들의 단기 예측을 1~2줄 요약으로 제공해주세요: ${assets.join(', ')}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const rawText = completion.choices[0].message.content || '';
  const predictions = assets.map((asset) => ({
    asset,
    prediction: `예측 결과: ${asset} 관련 요약 필요`, // 실제 파싱은 개선 필요
  }));

  return NextResponse.json({ predictions });
}