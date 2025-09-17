import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetThreadByIdQuery, useAddReplyMutation } from '../services/localApi';

function ReplyForm({ pokemon, parentId, onDone }) {
  const [addReply, { isLoading }] = useAddReplyMutation();
  const [f, setF] = useState({ name:'', email:'', body:'' });

  async function submit(e){
    e.preventDefault();
    if (!f.name.trim() || !f.email.trim() || !f.body.trim()) return;
    await addReply({ pokemon, parentId, name:f.name, email:f.email, body:f.body });
    setF({ name:'', email:'', body:'' });
    onDone?.();
  }

  return (
    <form onSubmit={submit} className="mt-2 space-y-2">
      <div className="grid md:grid-cols-2 gap-2">
        <input className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
               placeholder="Nombre" value={f.name} onChange={e=>setF({...f, name:e.target.value})}/>
        <input className="px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
               placeholder="Correo" value={f.email} onChange={e=>setF({...f, email:e.target.value})}/>
      </div>
      <textarea className="w-full px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                rows={3} placeholder="Respuesta…" value={f.body} onChange={e=>setF({...f, body:e.target.value})}/>
      <button disabled={isLoading} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm">
        Responder
      </button>
    </form>
  );
}

function CommentNode({ node, pokemon }) {
  const [showReply, setShowReply] = useState(false);
  const canReply = (node.depth ?? 0) < 4; 
  return (
    <li className="mt-3">
      <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
        {node.title && <div className="font-semibold">{node.title}</div>}
        <div className="text-sm whitespace-pre-wrap">{node.body}</div>
        <div className="text-xs text-slate-500 mt-1">
          Por {node.name} &lt;{node.email}&gt; — {new Date(node.createdAt).toLocaleString()}
        </div>
        {canReply && (
          <button onClick={()=>setShowReply(s=>!s)}
                  className="mt-2 px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-sm">
            {showReply ? 'Cancelar' : 'Responder'}
          </button>
        )}
        {showReply && canReply && (
          <ReplyForm pokemon={pokemon} parentId={node.id} onDone={()=>setShowReply(false)} />
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

export default function DiscussionDetail(){
  const { pokemon, id } = useParams(); // id top-level
  const navigate = useNavigate();
  const { data: thread, isLoading, isError, refetch } = useGetThreadByIdQuery({ pokemon, id: Number(id) });

  if (isLoading) return <p className="text-center py-10">Cargando…</p>;
  if (isError || !thread) return (
    <p className="text-center text-red-500 py-10">
      No encontrado. <button className="underline" onClick={()=>refetch()}>Reintentar</button>
    </p>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex items-center gap-2">
        <button onClick={()=>navigate(-1)} className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600">← Volver</button>
        <a href={`#/pokemon/${pokemon}`} className="px-3 py-2 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600">
          Ver Pokémon
        </a>
      </div>

      <h1 className="text-2xl font-bold mb-2">{thread.title || 'Sin título'}</h1>
      <div className="text-sm text-slate-500 mb-4">/pokemon/{pokemon}</div>

      <ul>
        <CommentNode node={thread} pokemon={pokemon} />
      </ul>
    </div>
  );
}