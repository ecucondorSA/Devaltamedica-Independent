declare module '@altamedica/diagnostic-engine' {
  export class DiagnosticEngine {
    startSession(input: any): { id: string };
    nextQuestion(sessionId: string): { id: string } | null;
    submitAnswer(sessionId: string, questionId: string, answer: any): void;
    generateReport(sessionId: string): any;
  }
}
