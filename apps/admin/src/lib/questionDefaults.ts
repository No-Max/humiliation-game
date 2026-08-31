export function buildDefaultQuestionCreateBody(seriesId: string) {
  return {
    seriesId,
    contentType: 'TEXT',
    prompt: 'Новое задание',
    correctAnswer: 'Ответ',
    answerType: 'TEXT',
    mediaUrls: [],
    audioUrl: null,
    choices: [],
    hints: [],
    acceptableAnswers: [],
    answerMedia: [],
  };
}
