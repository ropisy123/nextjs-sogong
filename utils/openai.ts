// utils/openai.ts
export async function getAIPredictions() {
    const response = await fetch('/api/predictions');
    const data = await response.json();
    return data.predictions;
  }
  