import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPokemonListQuery, useGetAllPokemonIndexQuery } from '../services/pokeApi';
import { useI18n } from '../i18n';

export default function PokemonList() {
  const { t } = useI18n();
  const navigate = useNavigate();


  const [page, setPage] = useState(0);         
  const [items, setItems] = useState([]);      
  const limit = 24;
  const offset = page * limit;

  // Búsqueda global
  const [q, setQ] = useState('');

  const { data: pageData, isLoading, isError, refetch } =
    useGetPokemonListQuery({ limit, offset });
  const { data: index = [] } = useGetAllPokemonIndexQuery();


  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return null;
    return index.filter((p) => p.name.includes(term)).slice(0, 60);
  }, [q, index]);

 
  useEffect(() => {
    if (!pageData?.items) return;
    setItems((prev) => {
     
      const idsPrev = new Set(prev.map((x) => x.id ?? x.name));
      const toAdd = pageData.items.filter((x) => !idsPrev.has(x.id ?? x.name));
      return [...prev, ...toAdd];
    });
  }, [pageData]);


  const itemsToRender = filtered
    ? filtered.map(({ id, name }) => ({
        id,
        name,
        sprites: {
          official: id
            ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
            : '',
        },
      }))
    : items;

  const totalCount = filtered ? filtered.length : pageData?.count ?? items.length;

 
  useEffect(() => {
    if (q.trim() === '' && page === 0 && items.length === 0 && pageData?.items) {
      setItems(pageData.items);
    }
  }, [q, page, items.length, pageData]);

  
  const handleClear = () => setQ('');

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Pokédex</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        {t('showing')} {itemsToRender.length} {t('of')} {totalCount}
      </p>

      {/* Buscador */}
      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search_placeholder')}
          className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 outline-none"
        />
        <button
          onClick={handleClear}
          className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
        >
          {t('clear')}
        </button>
      </div>

      {/* Estados de carga (solo sin búsqueda) */}
      {!filtered && page === 0 && isLoading && <p className="text-center py-10">{t('loading')}</p>}
      {!filtered && isError && (
        <p className="text-center text-red-500 py-10">
          {t('error_generic')}{' '}
          <button className="underline" onClick={() => refetch()}>{t('retry')}</button>
        </p>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
        {itemsToRender.map((p, i) => (
          <button
            key={p.id ?? p.name}
            onClick={() => navigate(`/pokemon/${p.name}`)}
            className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition p-3 flex flex-col items-center fade-up"
            style={{ animationDelay: `${(i % 24) * 20}ms` }}
            title={p.name}
          >
            <div className="aspect-square w-full bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden">
              {p.sprites?.official ? (
                <img src={p.sprites.official} alt={p.name} className="max-h-32 object-contain" />
              ) : (
                <div className="text-slate-500 text-sm">—</div>
              )}
            </div>
            <div className="mt-2 text-center w-full">
              <div className="text-xs opacity-70">#{p.id ?? '-'}</div>
              <div className="capitalize">{p.name}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Cargar más: AHORA ACUMULA (solo cuando no hay búsqueda) */}
      {!filtered && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40"
            onClick={() => setPage((p) => (items.length < (pageData?.count ?? 0) ? p + 1 : p))}
            disabled={items.length >= (pageData?.count ?? 0)}
          >
            {t('load_more')}
          </button>
        </div>
      )}
    </>
  );
}