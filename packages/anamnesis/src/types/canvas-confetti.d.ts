// Declaración mínima para canvas-confetti mientras no se instalan tipos oficiales.
declare module 'canvas-confetti' {
  interface Options { particleCount?: number; spread?: number; origin?: { x?: number; y?: number } }
  function confetti(opts?: Options): void
  export default confetti
}
