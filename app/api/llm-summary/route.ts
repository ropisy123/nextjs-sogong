import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { investmentPeriod, maxLossRate } = await req.json();

  const prompt = `
당신은 경제 분석가입니다. 사용자가 '${investmentPeriod}' 동안 '${maxLossRate}'의 손실을 감수할 수 있다고 가정할 때,
다음 자산들의 향후 변동성 및 투자 관점에서의 요약을 1~2줄씩 해주세요:

- 채권
- 금
- 나스닥
- 미국 대형 가치주
- 비트코인
- 서울 부동산

친절하지만 간결하게 요약해 주세요. 이모지도 허용됩니다.
`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '당신은 숙련된 금융 전문가입니다.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const result = await response.json();
    console.log('[OpenAI 응답]', JSON.stringify(result, null, 2)); // ✅ 추가

    if (result.error) {
      console.error('[OpenAI 에러]', result.error);
      return NextResponse.json({ summary: `❌ 오류: ${result.error.message}` }, { status: 500 });
    }

    const summary = result.choices?.[0]?.message?.content?.trim();
    return NextResponse.json({ summary: summary || '요약 생성 실패 (응답 없음)' });
  } catch (error) {
    console.error('OpenAI API 호출 예외:', error);
    return NextResponse.json({ summary: 'LLM 요약 생성 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
