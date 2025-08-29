'use client';

import { Button } from '@altamedica/ui';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-6 text-center">
      <h2 className="mb-4 text-xl font-semibold">Algo salió mal</h2>
      <pre className="mb-4 whitespace-pre-wrap text-red-600">{error.message}</pre>
      <Button onClick={() => reset()}>Reintentar</Button>
    </div>
  );
}
