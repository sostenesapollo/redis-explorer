'use client';

import { useState, useEffect } from 'react';
// Componente customizado para syntax highlighting JSON
const JsonHighlighter = ({ children }: { children: string }) => {
  const highlightJson = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      const formatted = JSON.stringify(parsed, null, 2);
      
      return formatted
        .replace(/(".*?")\s*:/g, '<span style="color: #79b8ff;">$1</span>:')
        .replace(/:\s*(".*?")/g, ': <span style="color: #9ecbff;">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span style="color: #f97583;">$1</span>')
        .replace(/:\s*(null)/g, ': <span style="color: #f97583;">$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color: #79b8ff;">$1</span>')
        .replace(/([{}[\],])/g, '<span style="color: #e1e4e8;">$1</span>');
    } catch {
      return json;
    }
  };

  return (
    <pre 
      className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono"
      style={{ lineHeight: '1.5' }}
      dangerouslySetInnerHTML={{ __html: highlightJson(children) }}
    />
  );
};

// Função utilitária para formatar JSON de forma bonita
const formatJsonPretty = (value: unknown, type: string) => {
  if (type === 'string') {
    // Tentar fazer parse do JSON se for uma string JSON
    try {
      const parsed = JSON.parse(String(value));
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  }
  if (type === 'unknown' && typeof value === 'string' && value.startsWith('[Erro:')) {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

interface RedisKey {
  key: string;
  type?: string;
  ttl?: number;
  value?: unknown;
  loaded?: boolean;
  loading?: boolean;
}

interface KeyGroup {
  prefix: string;
  keys: RedisKey[];
  isExpanded: boolean;
}

interface RedisExplorerProps {
  redisUrl: string;
  onDisconnect: () => void;
}

export default function RedisExplorer({ redisUrl, onDisconnect }: RedisExplorerProps) {
  const [keys, setKeys] = useState<RedisKey[]>([]);
  const [filteredKeys, setFilteredKeys] = useState<RedisKey[]>([]);
  const [keyGroups, setKeyGroups] = useState<KeyGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKey, setSelectedKey] = useState<RedisKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState({ key: '', type: 'string', value: '' });
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    loadKeys();
  }, [redisUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchTerm) {
      const filtered = keys.filter(key => 
        key.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredKeys(filtered);
    } else {
      setFilteredKeys(keys);
    }
  }, [searchTerm, keys]);

  useEffect(() => {
    if (filteredKeys.length > 0) {
      const groups = groupKeysBySimilarity(filteredKeys);
      setKeyGroups(groups);
    } else {
      setKeyGroups([]);
    }
  }, [filteredKeys]);

  const groupKeysBySimilarity = (keys: RedisKey[]): KeyGroup[] => {
    if (keys.length === 0) return [];

    // Ordenar chaves para facilitar o agrupamento
    const sortedKeys = [...keys].sort((a, b) => a.key.localeCompare(b.key));
    
    const groups: KeyGroup[] = [];
    let currentGroup: RedisKey[] = [];
    let currentPrefix = '';
    
    for (let i = 0; i < sortedKeys.length; i++) {
      const key = sortedKeys[i];
      
      if (currentGroup.length === 0) {
        // Primeira chave do grupo
        currentGroup = [key];
        currentPrefix = findCommonPrefix(key.key, sortedKeys[i + 1]?.key || '');
      } else {
        const nextPrefix = findCommonPrefix(currentPrefix, key.key);
        
        if (nextPrefix.length >= currentPrefix.length && nextPrefix.length > 0) {
          // A chave pertence ao grupo atual
          currentGroup.push(key);
          currentPrefix = nextPrefix;
        } else {
          // Finalizar grupo atual e começar novo
          if (currentGroup.length > 1) {
            groups.push({
              prefix: currentPrefix,
              keys: currentGroup,
              isExpanded: false
            });
          } else {
            // Chave única, adicionar como grupo individual
            groups.push({
              prefix: currentGroup[0].key,
              keys: currentGroup,
              isExpanded: true
            });
          }
          
          currentGroup = [key];
          currentPrefix = findCommonPrefix(key.key, sortedKeys[i + 1]?.key || '');
        }
      }
    }
    
    // Adicionar último grupo
    if (currentGroup.length > 0) {
      if (currentGroup.length > 1) {
        groups.push({
          prefix: currentPrefix,
          keys: currentGroup,
          isExpanded: false
        });
      } else {
        groups.push({
          prefix: currentGroup[0].key,
          keys: currentGroup,
          isExpanded: true
        });
      }
    }
    
    return groups;
  };

  const findCommonPrefix = (str1: string, str2: string): string => {
    if (!str2) return str1;
    
    let prefix = '';
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        prefix += str1[i];
      } else {
        break;
      }
    }
    
    // Se o prefixo termina no meio de uma palavra, voltar até o último separador
    const lastSeparator = Math.max(
      prefix.lastIndexOf('-'),
      prefix.lastIndexOf('_'),
      prefix.lastIndexOf(':'),
      prefix.lastIndexOf('.')
    );
    
    if (lastSeparator > 0) {
      return prefix.substring(0, lastSeparator + 1);
    }
    
    return prefix;
  };

  const toggleGroup = (groupIndex: number) => {
    setKeyGroups(prevGroups => 
      prevGroups.map((group, index) => 
        index === groupIndex 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Load keys');
      
      const response = await fetch(`/api/redis/keys?url=${encodeURIComponent(redisUrl)}`);
      const data = await response.json();
      
      console.log(data);
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      // Marcar todas as chaves como não carregadas
      const keysWithStatus = data.keys.map((key: { key: string }) => ({
        ...key,
        loaded: false,
        loading: false
      }));
      
      setKeys(keysWithStatus);
    } catch (err: unknown) {
      console.log('Error');
      
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError('Erro ao carregar chaves: ' + errorMessage);
      
      // Tentar obter informações de debug em caso de erro
      try {
        const debugResponse = await fetch(`/api/redis/logs?url=${encodeURIComponent(redisUrl)}`);
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          setDebugInfo(debugData);
        }
      } catch (debugErr) {
        console.warn('Não foi possível obter informações de debug:', debugErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadKeyValue = async (keyName: string) => {
    try {
      // Marcar a chave como carregando
      setKeys(prevKeys => 
        prevKeys.map(key => 
          key.key === keyName 
            ? { ...key, loading: true }
            : key
        )
      );

      const response = await fetch(`/api/redis/get?url=${encodeURIComponent(redisUrl)}&key=${encodeURIComponent(keyName)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      // Atualizar a chave com os dados carregados
      setKeys(prevKeys => 
        prevKeys.map(key => 
          key.key === keyName 
            ? { 
                ...key, 
                type: data.type,
                ttl: data.ttl,
                value: data.value,
                loaded: true,
                loading: false
              }
            : key
        )
      );
      
    } catch (err: unknown) {
      console.error('Erro ao carregar valor da chave:', err);
      
      // Marcar como erro
      setKeys(prevKeys => 
        prevKeys.map(key => 
          key.key === keyName 
            ? { 
                ...key, 
                value: '[Erro ao carregar]',
                loaded: true,
                loading: false
              }
            : key
        )
      );
    }
  };

  const handleKeyClick = async (key: RedisKey) => {
    setSelectedKey(key);
    
    // Se a chave não foi carregada ainda, carregar agora
    if (!key.loaded && !key.loading) {
      await loadKeyValue(key.key);
    }
  };

  const handleUpdateValue = async (newValue: string) => {
    if (!selectedKey) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/redis/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: redisUrl,
          key: selectedKey.key,
          type: selectedKey.type || 'string',
          value: newValue
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      await loadKeys();
      setSelectedKey(null);
    } catch (err: unknown) {
      setError('Erro ao atualizar valor: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (key: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/redis/delete?url=${encodeURIComponent(redisUrl)}&key=${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      await loadKeys();
      setSelectedKey(null);
    } catch (err: unknown) {
      setError('Erro ao deletar chave: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    if (!newKey.key || !newKey.value) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/redis/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: redisUrl,
          key: newKey.key,
          type: newKey.type,
          value: newKey.value
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error);
      }
      
      setNewKey({ key: '', type: 'string', value: '' });
      setShowCreateModal(false);
      await loadKeys();
    } catch (err: unknown) {
      setError('Erro ao criar chave: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };



  const getTypeColor = (type: string) => {
    const colors = {
      string: 'bg-green-100 text-green-800',
      list: 'bg-blue-100 text-blue-800',
      set: 'bg-purple-100 text-purple-800',
      hash: 'bg-yellow-100 text-yellow-800',
      zset: 'bg-red-100 text-red-800',
      unknown: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading && keys.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Conectando ao Redis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Erro de Conexão</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <div className="flex gap-2">
              <button
                onClick={loadKeys}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
              <button
                onClick={onDisconnect}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Redis Explorer</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nova Chave
              </button>
              <button
                onClick={loadKeys}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Atualizar
              </button>
              {debugInfo && (
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {showDebugInfo ? 'Ocultar Debug' : 'Mostrar Debug'}
                </button>
              )}
              <button
                onClick={onDisconnect}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Desconectar
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Debug Info Panel */}
        {showDebugInfo && debugInfo && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">
                Informações de Debug
              </h3>
              <button
                onClick={() => setShowDebugInfo(false)}
                className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Informações do Servidor</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Versão:</span> {debugInfo.serverInfo?.redis_version || 'N/A'}</div>
                  <div><span className="font-medium">Modo:</span> {debugInfo.serverInfo?.redis_mode || 'N/A'}</div>
                  <div><span className="font-medium">Uptime:</span> {debugInfo.serverInfo?.uptime_in_seconds ? `${Math.floor(debugInfo.serverInfo.uptime_in_seconds / 3600)}h` : 'N/A'}</div>
                  <div><span className="font-medium">Conexões:</span> {debugInfo.serverInfo?.connected_clients || 'N/A'}</div>
                  <div><span className="font-medium">Memória:</span> {debugInfo.serverInfo?.used_memory_human || 'N/A'}</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Testes de Conexão</h4>
                <div className="space-y-1 text-sm">
                  <div><span className="font-medium">Ping:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.debugInfo?.pingResult ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {debugInfo.debugInfo?.pingResult ? 'OK' : 'Falhou'}
                    </span>
                  </div>
                  <div><span className="font-medium">Keys:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.debugInfo?.keysCount !== undefined ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {debugInfo.debugInfo?.keysCount !== undefined ? `${debugInfo.debugInfo.keysCount} encontradas` : 'Erro'}
                    </span>
                  </div>
                  <div><span className="font-medium">Escrita:</span> 
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${debugInfo.debugInfo?.writeTest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {debugInfo.debugInfo?.writeTest ? 'OK' : 'Falhou'}
                    </span>
                  </div>
                  {debugInfo.debugInfo?.keysError && (
                    <div className="text-red-600 text-xs mt-2">
                      <strong>Erro Keys:</strong> {debugInfo.debugInfo.keysError}
                    </div>
                  )}
                  {debugInfo.debugInfo?.writeError && (
                    <div className="text-red-600 text-xs mt-2">
                      <strong>Erro Escrita:</strong> {debugInfo.debugInfo.writeError}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar chaves..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keys List */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                  Chaves ({filteredKeys.length})
                </h2>
              </div>
              <div className="overflow-y-auto">
                {keyGroups.map((group, groupIndex) => (
                  <div key={group.prefix} className="border-b border-gray-200 dark:border-gray-700">
                    {/* Cabeçalho do grupo */}
                    <div
                      onClick={() => toggleGroup(groupIndex)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          className={`w-4 h-4 transition-transform ${group.isExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {group.prefix}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({group.keys.length})
                        </span>
                      </div>
                    </div>
                    
                    {/* Chaves do grupo */}
                    {group.isExpanded && (
                      <div>
                        {group.keys.map((key) => (
                          <div
                            key={key.key}
                            onClick={() => handleKeyClick(key)}
                            className={`p-4 border-l-4 border-l-gray-200 dark:border-l-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              selectedKey?.key === key.key ? 'bg-red-50 dark:bg-red-900/20 border-l-red-500' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {key.key}
                                  </p>
                                  {key.loading && (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                  )}
                                  {!key.loaded && !key.loading && (
                                    <span className="text-xs text-gray-400">(clique para carregar)</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  {key.type && (
                                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(key.type || 'unknown')}`}>
                                      {key.type || 'unknown'}
                                    </span>
                                  )}
                                  {key.ttl !== undefined && key.ttl > 0 && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      TTL: {key.ttl}s
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteKey(key.key || '');
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {filteredKeys.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Nenhuma chave encontrada' : 'Nenhuma chave no Redis'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Key Details */}
          <div className="lg:col-span-2">
            {selectedKey ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {selectedKey.key}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedKey.type || 'unknown')}`}>
                        {selectedKey.type || 'unknown'}
                      </span>
                      {selectedKey.ttl && selectedKey.ttl > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          TTL: {selectedKey.ttl}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <KeyEditor
                    key={selectedKey.key}
                    keyData={selectedKey}
                    onUpdate={handleUpdateValue}
                    onDelete={() => handleDeleteKey(selectedKey.key || '')}
                  />
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>Selecione uma chave para visualizar e editar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showCreateModal && (
        <CreateKeyModal
          newKey={newKey}
          setNewKey={setNewKey}
          onCreate={handleCreateKey}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

// Key Editor Component
function KeyEditor({ keyData, onUpdate, onDelete }: { keyData: RedisKey; onUpdate: (value: string) => void; onDelete: () => void }) {
  const [value, setValue] = useState(formatJsonPretty(keyData.value, keyData.type || 'string'));
  const [isEditing, setIsEditing] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isValidJson, setIsValidJson] = useState(true);

  const validateJson = (jsonString: string) => {
    try {
      JSON.parse(jsonString);
      setJsonError(null);
      setIsValidJson(true);
    } catch (error: unknown) {
      setJsonError(error instanceof Error ? error.message : 'Erro desconhecido');
      setIsValidJson(false);
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(String(value));
      const formatted = JSON.stringify(parsed, null, 2);
      setValue(formatted);
      setJsonError(null);
      setIsValidJson(true);
    } catch (error: unknown) {
      setJsonError('JSON inválido: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setIsValidJson(false);
    }
  };

  const handleSave = () => {
    if (isValidJson) {
      onUpdate(String(value));
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setValue(formatJsonPretty(keyData.value, keyData.type || 'string'));
    setIsEditing(false);
    setJsonError(null);
    setIsValidJson(true);
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    validateJson(newValue);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Valor</h3>
        <div className="flex gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={formatJson}
                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-colors"
                title="Formatar JSON"
              >
                Formatar
              </button>
              <button
                onClick={handleSave}
                disabled={!isValidJson}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  isValidJson 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Salvar
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Cancelar
              </button>
            </>
          )}
          <button
            onClick={onDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            Deletar
          </button>
        </div>
      </div>

      {/* Error Message */}
      {jsonError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">{jsonError}</span>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="relative">
          <textarea
            value={String(value)}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`w-full h-64 p-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm resize-none ${
              isValidJson 
                ? 'border-gray-300 dark:border-gray-600' 
                : 'border-red-300 dark:border-red-600'
            }`}
            placeholder="Digite o valor JSON..."
            style={{ 
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />
          <div className="absolute top-2 right-2 text-xs text-gray-500 dark:text-gray-400">
            {isValidJson ? '✓ JSON válido' : '✗ JSON inválido'}
          </div>
        </div>
      ) : (
        <div className="relative">
          <JsonHighlighter>
            {String(formatJsonPretty(keyData.value, keyData.type || 'string'))}
          </JsonHighlighter>
        </div>
      )}
    </div>
  );
}

// Create Key Modal Component
function CreateKeyModal({ newKey, setNewKey, onCreate, onClose }: {
  newKey: { key: string; type: string; value: string };
  setNewKey: (key: { key: string; type: string; value: string }) => void;
  onCreate: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Criar Nova Chave
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome da Chave
              </label>
              <input
                type="text"
                value={newKey.key}
                onChange={(e) => setNewKey({ ...newKey, key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="ex: user:123"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo
              </label>
              <select
                value={newKey.type}
                onChange={(e) => setNewKey({ ...newKey, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="string">String</option>
                <option value="list">List</option>
                <option value="set">Set</option>
                <option value="hash">Hash</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Valor
              </label>
              <textarea
                value={newKey.value}
                onChange={(e) => setNewKey({ ...newKey, value: e.target.value })}
                className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white font-mono text-sm"
                placeholder={newKey.type === 'string' ? 'Valor da string' : 'JSON formatado'}
              />
              {newKey.type !== 'string' && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use formato JSON para {newKey.type}s
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onCreate}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Criar
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

