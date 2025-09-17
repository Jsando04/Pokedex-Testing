import React from 'react';
import { useI18n } from '../i18n';
import { useTheme } from '../theme';

export default function Header(){
  const { t, lang, setLang } = useI18n();
  const { dark, toggle } = useTheme();

  const LangBtn = ({ code, label }) => (
    <button
      onClick={()=> setLang(code)}
      className={`text-xs px-2 py-1 rounded border transition ${
        lang===code
          ? 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
      }`}
      title={label}
    >
      {label}
    </button>
  );

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/70 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <a href="#/" className="font-semibold text-slate-900 dark:text-slate-100">
          {t('app_title')}
        </a>

        <nav className="text-sm ml-2 flex gap-3">
          <a href="#/" className="text-slate-700 dark:text-slate-300 hover:underline">{t('nav_pokedex')}</a>
          <a href="#/discussions" className="text-slate-700 dark:text-slate-300 hover:underline">Discusiones</a>
          <a href="#/rules" className="text-slate-700 dark:text-slate-300 hover:underline">Reglas</a>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LangBtn code="es" label="ES Español" />
          <LangBtn code="en" label="US English" />
          <LangBtn code="pt" label="BR Português" />
          <button
            onClick={toggle}
            className="ml-2 w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title={dark ? 'Cambiar a claro' : 'Cambiar a oscuro'}
          >
            {dark ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}