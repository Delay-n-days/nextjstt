'use client'

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Trash2, Plus, RefreshCw, Database } from 'lucide-react';
import { getKeys, getKeyType, getStringValue, getListValue, deleteKey, setStringValue, addListItem } from '@/app/actions/redis';

interface KeyData {
  key: string;
  type: string;
  value?: string | string[];
  ttl?: number;
}

export default function RedisViewer({ initialKeys }: { initialKeys: string[] }) {
  const [keys, setKeys] = useState<string[]>(initialKeys);
  const [selectedKey, setSelectedKey] = useState<KeyData | null>(null);
  const [searchPattern, setSearchPattern] = useState('*');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newListItem, setNewListItem] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSearch = () => {
    startTransition(async () => {
      const result = await getKeys(searchPattern);
      if (result.success) {
        setKeys(result.keys || []);
      }
    });
  };

  const handleSelectKey = async (key: string) => {
    startTransition(async () => {
      const typeResult = await getKeyType(key);
      if (!typeResult.success) return;

      const type = typeResult.type;
      let data: KeyData = { key, type: type || 'unknown' };

      if (type === 'string') {
        const result = await getStringValue(key);
        if (result.success) {
          data.value = result.value || '';
          data.ttl = result.ttl;
        }
      } else if (type === 'list') {
        const result = await getListValue(key);
        if (result.success) {
          data.value = result.value || [];
          data.ttl = result.ttl;
        }
      }

      setSelectedKey(data);
    });
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`确定要删除 "${key}" 吗？`)) return;
    
    startTransition(async () => {
      const result = await deleteKey(key);
      if (result.success) {
        setKeys(keys.filter(k => k !== key));
        if (selectedKey?.key === key) {
          setSelectedKey(null);
        }
      }
    });
  };

  const handleAddString = async () => {
    if (!newKey || !newValue) return;
    
    startTransition(async () => {
      const result = await setStringValue(newKey, newValue);
      if (result.success) {
        handleSearch();
        setNewKey('');
        setNewValue('');
      }
    });
  };

  const handleAddListItem = async () => {
    if (!selectedKey || !newListItem) return;
    
    startTransition(async () => {
      const result = await addListItem(selectedKey.key, newListItem);
      if (result.success) {
        handleSelectKey(selectedKey.key);
        setNewListItem('');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <Database className="w-10 h-10 text-red-500" />
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Redis 查看器</h1>
            <p className="text-slate-600 dark:text-slate-400">管理和查看 Redis 键值数据</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：键列表 */}
          <Card className="lg:col-span-1 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                键列表
              </CardTitle>
              <CardDescription>共 {keys.length} 个键</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="搜索模式 (例: user:*)"
                  value={searchPattern}
                  onChange={(e) => setSearchPattern(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isPending} size="icon">
                  <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    添加字符串键
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新的字符串键</DialogTitle>
                    <DialogDescription>创建一个新的 Redis 字符串键值对</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="键名"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                    />
                    <Input
                      placeholder="值"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                    />
                    <Button onClick={handleAddString} className="w-full" disabled={isPending}>
                      添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {keys.map((key) => (
                    <div
                      key={key}
                      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedKey?.key === key
                          ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                          : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                      }`}
                      onClick={() => handleSelectKey(key)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm truncate flex-1">{key}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(key);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* 右侧：键详情 */}
          <Card className="lg:col-span-2 shadow-lg">
            <CardHeader>
              <CardTitle>键详情</CardTitle>
              <CardDescription>
                {selectedKey ? `查看和编辑 "${selectedKey.key}"` : '选择一个键查看详情'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedKey ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-slate-600 dark:text-slate-400">键名</p>
                      <p className="font-mono font-semibold text-lg">{selectedKey.key}</p>
                    </div>
                    <Badge variant={selectedKey.type === 'string' ? 'default' : 'secondary'} className="text-sm">
                      {selectedKey.type.toUpperCase()}
                    </Badge>
                    {selectedKey.ttl !== undefined && selectedKey.ttl > 0 && (
                      <Badge variant="outline" className="text-sm">
                        TTL: {selectedKey.ttl}s
                      </Badge>
                    )}
                  </div>

                  {selectedKey.type === 'string' && (
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">值</label>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                        <pre className="whitespace-pre-wrap break-words font-mono text-sm">
                          {selectedKey.value as string}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedKey.type === 'list' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          列表项 ({(selectedKey.value as string[]).length})
                        </label>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Plus className="w-4 h-4 mr-2" />
                              添加项
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>添加列表项</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="新项的值"
                                value={newListItem}
                                onChange={(e) => setNewListItem(e.target.value)}
                              />
                              <Button onClick={handleAddListItem} className="w-full" disabled={isPending}>
                                添加
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-2">
                          {(selectedKey.value as string[]).map((item, index) => (
                            <div
                              key={index}
                              className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
                            >
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="mt-1">{index}</Badge>
                                <pre className="flex-1 whitespace-pre-wrap break-words font-mono text-sm">
                                  {item}
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-slate-400">
                  <Database className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg">选择左侧的键查看详情</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}