'use client';

import { useState, useEffect } from 'react';
import RedisExplorer from './components/RedisExplorer';
import LoadingSpinner from './components/LoadingSpinner';

export default function Home() {
  const [redisUrl, setRedisUrl] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Carregar dados do localStorage apenas no cliente
    const loadFromStorage = () => {
      const savedUrl = localStorage.getItem('redis-url');
      if (savedUrl) {
        setRedisUrl(savedUrl);
        setIsConnected(true);
      }
      setIsLoading(false);
    };
    
    loadFromStorage();
  }, []);

  const handleConnect = () => {
    if (redisUrl.trim()) {
      localStorage.setItem('redis-url', redisUrl);
      setIsConnected(true);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('redis-url');
    setRedisUrl('');
    setIsConnected(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <LoadingSpinner message="Carregando Redis Explorer..." size="lg" />
      </div>
    );
  }

  if (isConnected) {
    return <RedisExplorer redisUrl={redisUrl} onDisconnect={handleDisconnect} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Redis Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Conecte-se ao seu servidor Redis
          </p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleConnect(); }} className="space-y-6">
          <div>
            <label htmlFor="redis-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              URL do Redis
            </label>
            <input
              id="redis-url"
              type="text"
              value={redisUrl}
              onChange={(e) => setRedisUrl(e.target.value)}
              placeholder="redis://localhost:6379"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Exemplo: redis://localhost:6379 ou redis://user:password@host:port
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Conectar
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sua URL será salva localmente para facilitar o acesso
          </p>
        </div>
      </div>
    </div>
  );
}
