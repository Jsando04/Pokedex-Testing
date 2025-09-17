import React, { useState, useEffect } from 'react';
import { useGetRulesQuery, useSetRulesMutation } from '../services/localApi';

export default function Rules() {
  const { data: rules = '', isFetching } = useGetRulesQuery();
  const [setRules, { isLoading, isSuccess }] = useSetRulesMutation();
  const [text, setText] = useState('');

  useEffect(() => { setText(rules); }, [rules]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reglas de la comunidad</h1>
      {isFetching ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <>
          <textarea
            rows={10}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 outline-none"
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setRules(text)}
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              disabled={isLoading}
            >
              Guardar reglas
            </button>
            {isSuccess && <span className="text-sm text-emerald-600">¡Guardado!</span>}
          </div>
        </>
      )}
    </div>
  );
}