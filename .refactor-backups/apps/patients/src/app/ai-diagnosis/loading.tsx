export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-neutral-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-2xl animate-pulse">
            <svg className="w-12 h-12 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <div className="absolute -top-2 -right-2 bg-green-500 p-2 rounded-full animate-ping">
            <div className="w-4 h-4" />
          </div>
        </div>
        <p className="mt-4 text-lg text-gray-600">Cargando IA médica...</p>
      </div>
    </div>
  );
}