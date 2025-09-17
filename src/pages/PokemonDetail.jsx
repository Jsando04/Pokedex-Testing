import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPokemonByNameQuery } from '../services/pokeApi';
import {
  useGetCommentsByPokemonQuery,     // top-level (para saber qué hilos hay)
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useGetThreadByIdQuery,            // árbol completo de un hilo
  useAddReplyMutation,              // responder en hilo
} from '../services/localApi';
import { useI18n } from '../i18n';

/* ---------- Subcomponentes de hilo (replies en cascada) ---------- */

function ReplyForm({ pokemon, parentId, onDone }) {
  const [addReply, { isLoading }] = useAddReplyMutation();
  const [f, setF] = useState({ name: '', email: '', body: '' });

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.body.trim()) return;
    await addReply({ pokemon, parentId, name: f.name, email: f.email, body: f.body });
    setF({ name: '', email: '', body: '' });
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      <div className="grid md:grid-cols-2 gap-2">
        <input
          className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          placeholder="Nombre"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
        />
        <input
          className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
          placeholder="Correo"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
        />
      </div>
      <textarea
        className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
        rows={3}
        placeholder="Respuesta…"
        value={f.body}
        onChange={(e) => setF({ ...f, body: e.target.value })}
      />
      <button
        disabled={isLoading}
        className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
      >
        Responder
      </button>
    </form>
  );
}

function CommentNode({ node, pokemon }) {
  const [showReply, setShowReply] = useState(false);
  const canReply = (node.depth ?? 0) < 4; // 0..4 (5 niveles totales)

  return (
    <li className="mt-3">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
        {node.title && <div className="font-semibold">{node.title}</div>}
        <div className="text-sm whitespace-pre-wrap break-words">{node.body}</div>
        <div className="text-xs text-slate-500 mt-1">
          Por {node.name} &lt;{node.email}&gt; — {new Date(node.createdAt).toLocaleString()}
        </div>

        {canReply && (
          <button
            onClick={() => setShowReply((s) => !s)}
            className="mt-2 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm"
          >
            {showReply ? 'Cancelar' : 'Responder'}
          </button>
        )}

        {showReply && canReply && (
          <ReplyForm pokemon={pokemon} parentId={node.id} onDone={() => setShowReply(false)} />
        )}
      </div>

      {node.replies?.length > 0 && (
        <ul className="ml-4 border-l border-slate-200 dark:border-slate-700 pl-4">
          {node.replies.map((r) => (
            <CommentNode key={r.id} node={r} pokemon={pokemon} />
          ))}
        </ul>
      )}
    </li>
  );
}

function CommentThread({ pokemon, rootId }) {
  // Trae el árbol completo (root + respuestas)
  const { data: thread, isLoading, isError, refetch } = useGetThreadByIdQuery({
    pokemon,
    id: Number(rootId),
  });

  if (isLoading) return <p className="text-slate-500">Cargando hilo…</p>;
  if (isError || !thread)
    return (
      <p className="text-red-500">
        No se pudo cargar el hilo.{' '}
        <button className="underline" onClick={() => refetch()}>
          Reintentar
        </button>
      </p>
    );

  return (
    <ul>
      <CommentNode node={thread} pokemon={pokemon} />
    </ul>
  );
}

/* ---------------------- Vista principal de ficha ---------------------- */

export default function PokemonDetail() {
  const { t } = useI18n();
  const { name } = useParams();
  const navigate = useNavigate();

  // Datos del Pokémon
  const { data: p, isLoading, isError, refetch } = useGetPokemonByNameQuery(name);

  // Top-level (para saber qué hilos hay). El hilo completo se pinta con <CommentThread/>
  const pokemonKey = String(name || '').toLowerCase();
  const { data: comments = [], isFetching } = useGetCommentsByPokemonQuery(pokemonKey);
  const [addComment, { isLoading: creating }] = useAddCommentMutation();
  const [updateComment, { isLoading: updating }] = useUpdateCommentMutation();
  const [deleteComment, { isLoading: deleting }] = useDeleteCommentMutation();

  // Formulario top-level (crear/editar)
  const [form, setForm] = useState({ id: null, title: '', name: '', email: '', body: '' });
  const editing = form.id !== null;

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const { id, title, name: author, email, body } = form;
    if (!author.trim() || !email.trim() || !body.trim()) return;
    if (!/\S+@\S+\.\S+/.test(email)) return;

    if (editing) {
      await updateComment({ pokemon: pokemonKey, id, patch: { title, name: author, email, body } });
    } else {
      await addComment({ pokemon: pokemonKey, title, name: author, email, body });
    }
    setForm({ id: null, title: '', name: '', email: '', body: '' });
  }

  async function onDeleteTop(c) {
    if (confirm('¿Eliminar comentario y sus respuestas?')) {
      await deleteComment({ pokemon: pokemonKey, id: c.id });
    }
  }

  function onEditTop(c) {
    setForm({ id: c.id, title: c.title || '', name: c.name, email: c.email, body: c.body });
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  // Derivados (no Hooks)
  const types = p?.types ? [...p.types].sort((a, b) => a.localeCompare(b)) : [];
  const abilities = p?.abilities ? [...p.abilities].sort((a, b) => a.localeCompare(b)) : [];
  const stats = p?.stats ?? [];

  if (isLoading) return <p className="text-center py-10">{t('loading')}</p>;
  if (isError || !p) {
    return (
      <p className="text-center text-red-500 py-10">
        {t('error_generic')}{' '}
        <button className="underline" onClick={() => refetch()}>
          {t('retry')}
        </button>
      </p>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
      >
        ← {t('back')}
      </button>

      {/* Card principal */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 grid md:grid-cols-2 gap-6 fade-up">
        <div className="aspect-square rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
          <img src={p.sprites?.official} alt={p.name} className="max-h-72 object-contain" />
        </div>

        <div>
          <h1 className="text-3xl font-bold capitalize">{p.name}</h1>
          <div className="text-sm text-slate-500 dark:text-slate-400">#{p.id}</div>

          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div>
              <div>
                <span className="font-semibold">{t('height')}:</span> {p.height}
              </div>
              <div>
                <span className="font-semibold">{t('weight')}:</span> {p.weight}
              </div>
            </div>
            <div>
              <div>
                <span className="font-semibold">{t('types')}:</span> {types.join(', ') || '—'}
              </div>
              <div>
                <span className="font-semibold">{t('abilities')}:</span> {abilities.join(', ') || '—'}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">{t('stats_base')}</h3>
            <ul className="space-y-2">
              {stats.map((s) => (
                <li key={s.name} className="flex items-center gap-3">
                  <span className="w-28 text-sm capitalize">{s.name}</span>
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min(Number(s.base) || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs w-8 text-right">{s.base}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Comentarios + hilos completos */}
      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-3">Comentarios</h2>

        {isFetching ? (
          <p className="text-slate-500">{t('loading')}</p>
        ) : comments.length === 0 ? (
          <p className="text-slate-500">Aún no hay comentarios.</p>
        ) : (
          <ul className="space-y-5">
            {comments.map((c) => (
              <li key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                {/* Cabecera del top-level + acciones */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    {c.title && <div className="font-semibold truncate">{c.title}</div>}
                    <div className="text-xs text-slate-500">
                      Por {c.name} &lt;{c.email}&gt; — {new Date(c.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => onEditTop(c)}
                      className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDeleteTop(c)}
                      className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-sm"
                      disabled={deleting}
                    >
                      Eliminar
                    </button>
                    <a
                      href={`#/discussion/${pokemonKey}/${c.id}`}
                      className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm"
                      title="Abrir hilo"
                    >
                      Ver hilo
                    </a>
                  </div>
                </div>

                {/* Hilo completo renderizado in-place */}
                <CommentThread pokemon={pokemonKey} rootId={c.id} />
              </li>
            ))}
          </ul>
        )}

        {/* Formulario agregar/editar top-level */}
        <form
          onSubmit={onSubmit}
          className="mt-6 space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4"
        >
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            placeholder="Título (tema)"
            className="w-full px-3 py-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none"
          />
          <div className="grid md:grid-cols-2 gap-3">
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Nombre"
              className="px-3 py-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none"
            />
            <input
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="Correo"
              className="px-3 py-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none"
            />
          </div>
          <textarea
            name="body"
            value={form.body}
            onChange={onChange}
            placeholder="Comentario"
            rows={4}
            className="w-full px-3 py-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
              disabled={creating || updating}
            >
              {editing ? 'Guardar cambios' : 'Añadir comentario'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setForm({ id: null, title: '', name: '', email: '', body: '' })}
                className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}