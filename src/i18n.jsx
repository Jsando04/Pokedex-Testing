import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const MESSAGES = {
  es: {
    app_title: 'Mi Pokédex 4You',
    nav_pokedex: 'Pokédex',
    search_placeholder: 'Buscar por nombre (busca en TODOS los Pokémon)…',
    clear: 'Limpiar',
    showing: 'Mostrando',
    of: 'de',
    load_more: 'Cargar más',
    loading: 'Cargando…',
    error_generic: 'Error al traer datos.',
    retry: 'Reintentar',
    back: 'Volver',
    height: 'Altura', weight: 'Peso', types: 'Tipos', abilities: 'Habilidades',
    stats_base: 'Estadísticas base',
  },
  en: {
    app_title: 'My Pokédex 4You',
    nav_pokedex: 'Pokédex',
    search_placeholder: 'Search by name (searches ALL Pokémon)…',
    clear: 'Clear',
    showing: 'Showing',
    of: 'of',
    load_more: 'Load more',
    loading: 'Loading…',
    error_generic: 'Failed to fetch data.',
    retry: 'Retry',
    back: 'Back',
    height: 'Height', weight: 'Weight', types: 'Types', abilities: 'Abilities',
    stats_base: 'Base stats',
  },
  pt: {
    app_title: 'Minha Pokédex 4You',
    nav_pokedex: 'Pokédex',
    search_placeholder: 'Buscar por nome (procura em TODOS os Pokémon)…',
    clear: 'Limpar',
    showing: 'Mostrando',
    of: 'de',
    load_more: 'Carregar mais',
    loading: 'Carregando…',
    error_generic: 'Erro ao buscar dados.',
    retry: 'Tentar novamente',
    back: 'Voltar',
    height: 'Altura', weight: 'Peso', types: 'Tipos', abilities: 'Habilidades',
    stats_base: 'Estatísticas base',
  },
};

const I18nCtx = createContext({ t:(k)=>k, lang:'es', setLang:()=>{} });

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'es');
  useEffect(()=> localStorage.setItem('lang', lang), [lang]);
  const t = useMemo(()=> (k)=> MESSAGES[lang]?.[k] ?? k, [lang]);
  return <I18nCtx.Provider value={{ t, lang, setLang }}>{children}</I18nCtx.Provider>;
}
export function useI18n(){ return useContext(I18nCtx); }