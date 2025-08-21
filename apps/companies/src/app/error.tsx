'use client'

type ErrorProps = {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold mb-4">Algo salió mal</h2>
      <pre className="text-red-600 whitespace-pre-wrap mb-4">{error.message}</pre>
      <button onClick={() => reset()} className="px-3 py-2 bg-blue-600 text-white rounded">Reintentar</button>
    </div>
  );
}