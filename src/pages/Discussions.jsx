import React from 'react';
import { useGetAllTopLevelCommentsQuery } from '../services/localApi';

export default function Discussions() {
  const { data: list = [], isLoading } = useGetAllTopLevelCommentsQuery();

  if (isLoading) return <p className="text-center py-10">Cargando…</p>;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Discusiones</h1>
      {list.length === 0 ? (
        <p className="text-slate-500">Aún no hay discusiones.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li key={`${c.pokemon}-${c.id}`} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500">/pokemon/{c.pokemon}</div>
                  <div className="font-semibold truncate">{c.title || 'Sin título'}</div>
                  <div className="text-sm mt-1 line-clamp-2">{c.body}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Por {c.name} — {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
                <a
                  href={`#/discussion/${c.pokemon}/${c.id}`}
                  className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm shrink-0"
                >
                  Abrir
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}