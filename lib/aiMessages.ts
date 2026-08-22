/**
 * AI encouragement messages.
 *
 * The real implementation would call `@github/copilot-api`, but that requires
 * authentication that is not available in this client-only app. Instead we ship
 * a deterministic mock "model" that produces varied, level-aware messages.
 */

export const quotes: string[] = [
  '성공은 작은 노력의 반복입니다.',
  '꾸준함이 재능을 이깁니다.',
  '오늘의 집중이 내일의 실력이 됩니다.',
  '시작이 반이고, 계속하는 것이 나머지 반입니다.',
  '작은 습관이 큰 변화를 만듭니다.',
  '어제의 나보다 한 걸음 앞서 있습니다.',
  '집중한 25분은 흘려보낸 하루보다 강합니다.',
  '멈추지 않는 한, 얼마나 천천히 가는지는 중요하지 않습니다.',
  '완벽함보다 꾸준함을 선택하세요.',
  '노력은 배신하지 않습니다, 시간이 걸릴 뿐입니다.',
  '깊은 몰입은 최고의 휴식을 만듭니다.',
  '오늘 쌓은 벽돌 하나가 내일의 성을 만듭니다.',
  '포기하고 싶을 때가 바로 성장하는 순간입니다.',
  '집중력은 근육과 같습니다. 쓸수록 강해집니다.',
  '결과보다 과정을 사랑하는 사람이 끝까지 갑니다.',
  '한 번에 하나씩, 그것이 가장 빠른 길입니다.',
  '당신의 시간은 당신이 집중한 곳으로 흐릅니다.',
  '지루한 반복이 비범한 결과를 만듭니다.',
  '스스로와의 약속을 지키는 것이 자신감의 시작입니다.',
  '휴식도 성장의 일부입니다. 잘 쉬고 다시 시작하세요.',
  '오늘도 한 뼘 자랐습니다. 그거면 충분합니다.',
  '큰 목표는 작은 타이머 하나에서 시작됩니다.',
  '집중하는 사람에게 시간은 더 많은 것을 돌려줍니다.',
  '지금 이 순간이 미래의 당신을 만듭니다.',
];

const milestoneNotes: Record<number, string> = {
  5: '벌써 20개의 뽀모도로를 완주했어요.',
  10: '두 자리 레벨 진입! 이제 습관이 되었네요.',
  25: '25레벨은 아무나 오르지 못하는 자리입니다.',
  50: '50레벨, 진정한 집중의 장인입니다.',
  100: '100레벨! 전설이 되셨습니다.',
};

/** Deterministic level-based rotation so each level feels distinct. */
export function generateLevelUpMessage(level: number): string {
  const safeLevel = Math.max(1, Math.floor(level) || 1);
  const quote = quotes[(safeLevel - 1) % quotes.length];
  const milestone = milestoneNotes[safeLevel];

  const base = `축하합니다! 레벨 ${safeLevel}에 도달하셨습니다. ${quote}`;
  return milestone ? `${base} ${milestone}` : base;
}

/**
 * Simulated async "AI" call. Mirrors the shape of a real Copilot API request so
 * swapping in `@github/copilot-api` later only requires changing this function.
 */
export async function requestLevelUpMessage(level: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return generateLevelUpMessage(level);
}

export function generateDailyTip(): string {
  return quotes[Math.floor(Math.random() * quotes.length)];
}
