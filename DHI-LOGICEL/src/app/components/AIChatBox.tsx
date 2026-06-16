import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Send, Sparkles, X, Minimize2, Maximize2, ArrowLeft,
  TrendingUp, Bug, TestTube, BarChart3, Clock, FileText,
  HelpCircle, User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import {
  suggerePriorite, suggereDeveloppeur,
  genererCasDeTest, genererResumeAnomalies,
  predireTempsResolution, analyserTendances,
  genererRapportIA
} from '../services/aiService';

type Step = 'menu'
  | 'priorite_input' | 'developpeur_input'
  | 'cas_test_input' | 'prediction_input'
  | 'rapport_campagne_input'
  | 'done';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const MENU_OPTIONS = (t: (key: string) => string) => [
  { key: '1', icon: Bug, label: t('ai.suggerer_priorite'), desc: t('ai.suggerer_priorite_desc'), color: 'text-red-600', bg: 'bg-red-50' },
  { key: '2', icon: User, label: t('ai.suggerer_developpeur'), desc: t('ai.suggerer_developpeur_desc'), color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: '3', icon: TestTube, label: t('ai.generer_cas_test'), desc: t('ai.generer_cas_test_desc'), color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: '4', icon: BarChart3, label: t('ai.resume_anomalies'), desc: t('ai.resume_anomalies_desc'), color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { key: '5', icon: Clock, label: t('ai.predire_delai'), desc: t('ai.predire_delai_desc'), color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: '6', icon: TrendingUp, label: t('ai.analyser_tendances'), desc: t('ai.analyser_tendances_desc'), color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { key: '7', icon: FileText, label: t('ai.rapport_campagne'), desc: t('ai.rapport_campagne_desc'), color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: '0', icon: HelpCircle, label: t('ai.aide'), desc: t('ai.aide_desc'), color: 'text-slate-600', bg: 'bg-slate-50' },
];

function MenuView({ onSelect, t }: { onSelect: (key: string) => void; t: (key: string) => string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 mb-3 px-0.5">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">{t('ai.que_souhaitez_vous_faire')}</span>
      </div>
      {MENU_OPTIONS(t).map(opt => {
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            onClick={() => onSelect(opt.key)}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-transparent transition-all duration-150 hover:border-slate-200 hover:bg-slate-50 active:scale-[0.98]"
          >
            <div className={`w-9 h-9 rounded-lg ${opt.bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${opt.color}`} />
            </div>
            <div className="text-left min-w-0">
              <div className="text-sm font-medium text-slate-800 leading-tight">{opt.label}</div>
              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{opt.desc}</div>
            </div>
            <div className="ml-auto text-slate-300 text-xs font-mono">{opt.key}</div>
          </button>
        );
      })}
    </div>
  );
}

function BotMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm max-w-[85%]">
        <p className="text-[13px] text-slate-700 leading-relaxed whitespace-pre-line">{content}</p>
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5 justify-end">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-sm max-w-[85%]">
        <p className="text-[13px] text-white leading-relaxed whitespace-pre-line">{content}</p>
      </div>
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-sm">
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
      <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    </div>
  );
}

interface AIChatBoxProps {
  open?: boolean;
  onClose?: () => void;
}

export function AIChatBox({ open = true, onClose }: AIChatBoxProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [step, setStep] = useState<Step>('menu');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const msgId = useRef(0);

  const { currentUser, users } = useAuth();
  const { anomalies, fonctionnalites, campagnes } = useData();
  const developpeurs = users.filter(u => u.role === 'developpeur');

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
      }
    });
  }, []);

  useEffect(scrollToBottom, [messages]);

  const envoyer = useCallback((message: string) => {
    setMessages(prev => [...prev, { id: `m-${++msgId.current}`, role: 'assistant', content: message }]);
  }, []);

  const retourMenu = useCallback(() => {
    setStep('menu');
  }, []);

  const terminer = useCallback(() => {
    setStep('done');
  }, []);

  const executer = useCallback((action: () => void) => {
    action();
    scrollToBottom();
  }, [scrollToBottom]);

  const traiterMenu = useCallback((choix: string) => {
    switch (choix) {
      case '1': setStep('priorite_input'); envoyer(t('ai.entrez_description_anomalie')); break;
      case '2': setStep('developpeur_input'); envoyer(t('ai.entrez_description_developpeur')); break;
      case '3': setStep('cas_test_input'); envoyer(t('ai.entrez_description_fonctionnalite')); break;
      case '5': setStep('prediction_input'); envoyer(t('ai.entrez_description_delai')); break;
      case '7':
        if (campagnes.length === 0) { envoyer(t('ai.aucune_campagne')); terminer(); return; }
        setStep('rapport_campagne_input');
        envoyer(`${t('ai.choisissez_campagne')}\n\n${campagnes.map((c, i) => `  ${i + 1}. ${c.nom}`).join('\n')}`);
        break;
      case '4':
        executer(() => {
          if (anomalies.length === 0) { envoyer(t('ai.aucune_anomalie')); }
          else { envoyer(genererResumeAnomalies(anomalies)); }
          terminer();
        });
        break;
      case '6':
        executer(() => {
          const tend = analyserTendances(anomalies, fonctionnalites);
          const lignes = tend.map(x => `${x.titre} : ${x.valeur}\n${x.description}`).join('\n\n');
          envoyer(`── ${t('dashboard.ai_trends')} ──\n\n${lignes}`);
          terminer();
        });
        break;
      case '0':
        envoyer([
          t('ai.aide_titre'),
          '',
          `1  ${t('ai.suggerer_priorite')}`,
          `2  ${t('ai.suggerer_developpeur')}`,
          `3  ${t('ai.generer_cas_test')}`,
          `4  ${t('ai.resume_anomalies')}`,
          `5  ${t('ai.predire_delai')}`,
          `6  ${t('ai.analyser_tendances')}`,
          `7  ${t('ai.rapport_campagne')}`,
          '',
          t('ai.aide_instruction'),
        ].join('\n'));
        break;
    }
  }, [anomalies, fonctionnalites, campagnes, envoyer, terminer, executer, t]);

  const traiterPriorite = useCallback((texte: string) => {
    const p = suggerePriorite(texte, '');
    envoyer(t('ai.priorite_suggeree', { priority: p }));
    terminer();
  }, [envoyer, terminer, t]);

  const traiterDeveloppeur = useCallback((texte: string) => {
    if (developpeurs.length === 0) { envoyer(t('ai.aucun_developpeur')); terminer(); return; }
    const id = suggereDeveloppeur({ titre: texte, description: '' }, anomalies, developpeurs);
    const dev = id ? developpeurs.find(d => d.id === id) : null;
    envoyer(dev ? t('ai.developpeur_suggere', { name: `${dev.prenom} ${dev.nom}` }) : t('ai.impossible_suggerer'));
    terminer();
  }, [developpeurs, anomalies, envoyer, terminer, t]);

  const traiterCasTest = useCallback((texte: string) => {
    const cas = genererCasDeTest(texte);
    if (cas.length === 0) { envoyer(t('ai.aucun_cas_test')); terminer(); return; }
    const lignes = cas.map(ct =>
      `[${ct.id}] ${ct.titre}\n  ${t('ai.objectif')} : ${ct.objectif}` +
      (ct.prerequis.length ? `\n  ${t('ai.prerequis')} : ${ct.prerequis.join(', ')}` : '') +
      `\n${ct.etapes.map((e, j) => `  ${j + 1}. ${e}`).join('\n')}\n  ${t('ai.resultat_attendu')} : ${ct.resultatAttendu}`
    ).join('\n\n');
    envoyer(`${t('ai.cas_test_generes', { count: cas.length })}\n\n${lignes}`);
    terminer();
  }, [envoyer, terminer, t]);

  const traiterPrediction = useCallback((texte: string) => {
    const p = suggerePriorite(texte, '');
    const pred = predireTempsResolution({ titre: texte, description: '', priorite: p }, anomalies);
    envoyer(pred.estimation);
    terminer();
  }, [anomalies, envoyer, terminer]);

  const traiterRapportCampagne = useCallback((texte: string) => {
    const index = parseInt(texte.trim(), 10) - 1;
    if (isNaN(index) || index < 0 || index >= campagnes.length) {
      envoyer(t('ai.numero_invalide'));
      return;
    }
    const c = campagnes[index];
    envoyer(genererRapportIA(c, anomalies.filter(a => a.campagneId === c.id), fonctionnalites.filter(f => f.campagneId === c.id)));
    terminer();
  }, [campagnes, anomalies, fonctionnalites, envoyer, terminer]);

  const handleSendMessage = useCallback(async () => {
    const texte = input.trim();
    if (!texte || isLoading) return;

    setMessages(prev => [...prev, { id: `m-${++msgId.current}`, role: 'user', content: texte }]);
    setInput('');
    setIsLoading(true);

    try {
      if (step === 'menu') traiterMenu(texte);
      else if (step === 'done') { retourMenu(); traiterMenu(texte); }
      else if (step === 'priorite_input') traiterPriorite(texte);
      else if (step === 'developpeur_input') traiterDeveloppeur(texte);
      else if (step === 'cas_test_input') traiterCasTest(texte);
      else if (step === 'prediction_input') traiterPrediction(texte);
      else if (step === 'rapport_campagne_input') traiterRapportCampagne(texte);
    } catch {
      envoyer(t('ai.erreur_survenue'));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, step, traiterMenu, traiterPriorite, traiterDeveloppeur, traiterCasTest, traiterPrediction, traiterRapportCampagne, envoyer, t]);

  const onClickMenuItem = useCallback((key: string) => {
    setMessages(prev => [...prev, { id: `m-${++msgId.current}`, role: 'user', content: key }]);
    setIsLoading(true);
    try {
      traiterMenu(key);
    } catch {
      envoyer(t('ai.erreur_survenue'));
    }
    setIsLoading(false);
  }, [traiterMenu, envoyer, t]);

  if (!open) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[26rem] bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800">
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
            {messages.map(msg =>
              msg.role === 'user'
                ? <UserMessage key={msg.id} content={msg.content} />
                : <BotMessage key={msg.id} content={msg.content} />
            )}

            {step === 'menu' && <MenuView onSelect={onClickMenuItem} t={t} />}

            {step === 'done' && (
              <div className="flex justify-center pt-1">
                <button
                  onClick={retourMenu}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 px-3 rounded-full hover:bg-slate-100"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t('ai.retour_menu')}
                </button>
              </div>
            )}

            {isLoading && <LoadingDots />}
          </div>

          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                placeholder={
                  step === 'menu' ? t('ai.placeholder_menu') :
                  step === 'done' ? t('ai.placeholder_done') :
                  step === 'rapport_campagne_input' ? t('ai.placeholder_campagne') :
                  t('ai.placeholder_default')
                }
                disabled={isLoading}
                className="flex-1 bg-white border-slate-200 rounded-xl text-sm h-10 placeholder:text-slate-400 focus-visible:ring-purple-400"
              />
              <Button
                onClick={handleSendMessage}
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