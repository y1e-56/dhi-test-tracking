import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Send, Sparkles, X, Minimize2, Maximize2,
  TrendingUp, Bug, TestTube, BarChart3, Clock, FileText,
  HelpCircle, User, Copy, Download, Check, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { envoyerMessageIA } from '../services/aiService';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function InlineContent({ text }: { text: string }) {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 rounded bg-slate-700 text-purple-300 text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === '') {
      elements.push(<div key={`e${i}`} className="h-1.5" />);
      continue;
    }

    if (line.startsWith('── ') && line.endsWith(' ──')) {
      elements.push(
        <div key={`e${i}`} className="text-xs font-bold uppercase tracking-widest text-purple-400 py-1.5">
          {line.slice(3, -3)}
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)[\.\s]\s*(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`e${i}`} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
          <span className="text-purple-400 font-mono shrink-0">{numMatch[1]}.</span>
          <InlineContent text={numMatch[2]} />
        </div>
      );
      continue;
    }

    if (line.startsWith('  ')) {
      elements.push(
        <div key={`e${i}`} className="text-sm text-slate-400 pl-4 leading-relaxed">
          <InlineContent text={line.trim()} />
        </div>
      );
      continue;
    }

    elements.push(
      <div key={`e${i}`} className="text-sm text-slate-300 leading-relaxed">
        <InlineContent text={line} />
      </div>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function TypingText({ text, onDone }: { text: string; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const speed = text.length > 200 ? 4 : text.length > 80 ? 8 : 12;
    const timer = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(timer);
        onDone?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, onDone]);

  return <MarkdownContent content={displayed} />;
}

function BotMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm max-w-[85%]">
        <TypingText text={content} />
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5 justify-end">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-sm max-w-[85%]">
        <p className="text-[13px] text-white leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
          <User className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: BarChart3, label: 'Résumé des anomalies', action: 'Donne-moi un résumé des anomalies' },
  { icon: TrendingUp, label: 'Tendances qualité', action: 'Quelles sont les tendances qualité ?' },
  { icon: FileText, label: 'Rapport campagne', action: 'Génère un rapport de campagne' },
  { icon: Bug, label: 'Suggérer priorité', action: 'Suggère-moi une priorité pour une anomalie' },
];

interface AIChatBoxProps {
  open?: boolean;
  onClose?: () => void;
}

export function AIChatBox({ open = true, onClose }: AIChatBoxProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  const pageContext = useMemo(() => {
    const match = location.pathname.match(/\/campagnes\/(\d+)/);
    if (match) return { campaignId: match[1] };
    return null;
  }, [location.pathname]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(scrollToBottom, [messages]);

  const ajouterMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { id: `m-${++msgId.current}`, role, content }]);
  }, []);

  const handleSendMessage = useCallback(async (texte: string) => {
    const message = texte.trim();
    if (!message || isLoading) return;

    ajouterMessage('user', message);
    setInput('');
    setIsLoading(true);

    try {
      const { reply } = await envoyerMessageIA(message, pageContext?.campaignId);
      ajouterMessage('assistant', reply);
    } catch {
      ajouterMessage('assistant', `Désolé, je n'ai pas pu traiter votre demande. Vérifiez qu'Ollama est lancé (\`ollama run qwen2.5:7b\`).`);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, pageContext, ajouterMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(input);
    }
  }, [handleSendMessage, input]);

  const handleCopy = useCallback(() => {
    const text = messages.map(m => `${m.role === 'user' ? 'Vous' : 'Assistant'} :\n${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [messages]);

  const handleDownload = useCallback(() => {
    const text = messages.map(m => `${m.role === 'user' ? 'Vous' : 'Assistant'} :\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([`Assistant IA - DHI\n${new Date().toLocaleString('fr-FR')}\n\n${text}`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-ia-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[26rem] bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-700">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{t('layout.ai_assistant')}</div>
            <div className="text-[10px] text-slate-400 font-medium">{t('layout.ai_subtitle')}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleCopy}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={copied ? t('ai.copied') : t('ai.copy')}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleDownload}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                title={t('ai.download')}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            onClick={() => setIsMinimized(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
          </button>
          {onClose && (
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5" ref={messagesContainerRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">{t('ai.bienvenue')}</h2>
                <p className="text-sm text-slate-400 text-center max-w-xs mb-6">{t('ai.bienvenue_desc')}</p>
                <div className="grid grid-cols-2 gap-2 w-full">
                  {SUGGESTIONS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(s.action)}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-800 border border-slate-700/60 hover:border-purple-500/40 hover:bg-slate-750 transition-all duration-150 text-center"
                      >
                        <Icon className="w-4 h-4 text-purple-400" />
                        <span className="text-[11px] text-slate-300 leading-tight">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg =>
                  msg.role === 'user'
                    ? <UserMessage key={msg.id} content={msg.content} />
                    : <BotMessage key={msg.id} content={msg.content} />
                )}
                {isLoading && <LoadingDots />}
              </>
            )}
          </div>

          <div className="border-t border-slate-700/50 px-4 py-3 bg-slate-800/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écrivez votre message..."
                disabled={isLoading}
                className="flex-1 bg-slate-800 border-slate-600 rounded-xl text-sm h-10 text-slate-200 placeholder:text-slate-500 focus-visible:ring-purple-400"
              />
              <Button
                onClick={() => handleSendMessage(input)}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-md shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
