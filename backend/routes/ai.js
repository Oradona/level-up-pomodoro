const express = require('express');

const router = express.Router();

const englishQuotes = [
  'Discipline is the quiet force that turns intention into identity.',
  'What you repeat in silence becomes the architecture of your future.',
  'Progress worthy of respect is almost always built in private.',
  'A stronger life is rarely found in comfort, but often revealed through consistency.',
  'Each finished session is evidence that your focus can be trusted.'
];

const koreanQuotes = [
  '집중은 재능이 아니라, 반복을 통해 스스로에게 증명하는 태도입니다.',
  '작은 완수의 축적이 결국 큰 변화를 만듭니다.',
  '흔들리지 않는 하루는 거창한 결심보다 조용한 실행에서 시작됩니다.',
  '오늘의 몰입은 미래의 자신에게 보내는 가장 정직한 투자입니다.',
  '꾸준함은 눈에 띄지 않지만 결국 가장 멀리 갑니다.'
];

const openings = [
  'Level %LEVEL% is not a reward for talent alone.',
  'You have reached level %LEVEL%, and that matters for a serious reason.',
  'Level %LEVEL% marks a measurable shift in who you are becoming.',
  'This rise to level %LEVEL% was earned through repeated discipline.'
];

const closings = [
  'Protect that standard, and let your next session prove this was not an accident.',
  'Keep moving with intention. Depth is built one honest interval at a time.',
  'Do not chase intensity alone. Honor consistency, and growth will continue.',
  'Stay deliberate. Real confidence is built by keeping promises to yourself.'
];

function createMotivationMessage(level = 1) {
  const safeLevel = Math.max(1, Number(level) || 1);
  const useKorean = safeLevel % 2 === 0;
  const quotePool = useKorean ? koreanQuotes : englishQuotes;
  const quote = quotePool[safeLevel % quotePool.length];
  const opening = openings[safeLevel % openings.length].replace('%LEVEL%', safeLevel);
  const closing = closings[(safeLevel + 1) % closings.length];
  const language = useKorean ? 'ko' : 'en';

  return {
    level: safeLevel,
    language,
    message: `${opening} ${quote} ${closing}`,
    quote
  };
}

router.post('/motivate', (req, res) => {
  const { level } = req.body || {};
  return res.json(createMotivationMessage(level));
});

module.exports = {
  router,
  createMotivationMessage
};
