import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

const LS_COMMENTS_KEY = 'pkx_comments_v2';  
const LS_RULES_KEY = 'pkx_rules_v1';

const keyFor = (pokemon) => String(pokemon || '').trim().toLowerCase();

function readComments() {
  try { return JSON.parse(localStorage.getItem(LS_COMMENTS_KEY)) || {}; }
  catch { return {}; }
}
function writeComments(map) {
  localStorage.setItem(LS_COMMENTS_KEY, JSON.stringify(map));
}

function readRules() {
  const d = localStorage.getItem(LS_RULES_KEY);
  if (d) return d;
  return `Reglas de la comunidad:
- Sé respetuoso.
- No spam.
- Evita spoilers sin avisar.
- Usa un lenguaje adecuado.`;
}
function writeRules(text) {
  localStorage.setItem(LS_RULES_KEY, text);
}

const sanitize = (s) => String(s ?? '').trim().slice(0, 5000);
const now = () => Date.now();


function buildThread(list, rootId) {
  const byId = new Map(list.map((c) => [c.id, { ...c, replies: [] }]));
  list.forEach((c) => {
    if (c.parentId != null) {
      const parent = byId.get(c.parentId);
      if (parent) parent.replies.push(byId.get(c.id));
    }
  });
  const root = byId.get(rootId);
  if (!root) return null;

  
  function clampDepth(node, depth = 0) {
    node.depth = depth;
    if (!Array.isArray(node.replies)) node.replies = [];
    if (depth >= 4) { node.replies = []; return; } 
    node.replies.forEach((r) => clampDepth(r, depth + 1));
  }
  clampDepth(root, root.depth ?? 0);
  return root;
}

export const localApi = createApi({
  reducerPath: 'localApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Comments', 'Rules', 'Threads'],
  endpoints: (builder) => ({
    // ----- Reglas -----
    getRules: builder.query({
      queryFn: async () => ({ data: readRules() }),
      providesTags: ['Rules'],
    }),
    setRules: builder.mutation({
      queryFn: async (text) => { writeRules(sanitize(text)); return { data: true }; },
      invalidatesTags: ['Rules'],
    }),

    // ----- Comentarios por Pokémon -----
    getCommentsByPokemon: builder.query({
      queryFn: async (pokemonKey) => {
        const map = readComments();
        const list = map[keyFor(pokemonKey)] || [];

        const tops = list.filter(c => c.parentId == null).sort((a,b)=>b.createdAt-a.createdAt);
        return { data: tops };
      },
      providesTags: (r, e, arg) => [{ type: 'Comments', id: keyFor(arg) }, 'Threads'],
    }),

    addComment: builder.mutation({
      queryFn: async ({ pokemon, title, name, email, body }) => {
        const k = keyFor(pokemon);
        const map = readComments();
        const list = map[k] || [];
        const item = {
          id: now(),
          pokemon: k,
          title: sanitize(title) || sanitize(body).slice(0, 60) || 'Sin título',
          name: sanitize(name),
          email: sanitize(email),
          body: sanitize(body),
          parentId: null,
          depth: 0,
          createdAt: now(),
          updatedAt: now(),
        };
        map[k] = [...list, item];
        writeComments(map);
        return { data: item };
      },
      invalidatesTags: (r, e, arg) => [{ type: 'Comments', id: keyFor(arg?.pokemon) }, 'Threads'],
    }),

    updateComment: builder.mutation({
      queryFn: async ({ pokemon, id, patch }) => {
        const k = keyFor(pokemon);
        const map = readComments();
        const list = map[k] || [];
        const i = list.findIndex((x) => x.id === id);
        if (i < 0) return { error: { status: 404, message: 'Not found' } };
        const updated = { ...list[i], ...patch, updatedAt: now() };
        map[k] = [...list.slice(0, i), updated, ...list.slice(i + 1)];
        writeComments(map);
        return { data: updated };
      },
      invalidatesTags: (r, e, arg) => [{ type: 'Comments', id: keyFor(arg?.pokemon) }, 'Threads'],
    }),

    deleteComment: builder.mutation({
      queryFn: async ({ pokemon, id }) => {
        const k = keyFor(pokemon);
        const map = readComments();
        const list = map[k] || [];
 
        const toDelete = new Set([id]);
        let changed;
        do {
          changed = false;
          for (const c of list) {
            if (c.parentId != null && toDelete.has(c.parentId) && !toDelete.has(c.id)) {
              toDelete.add(c.id); changed = true;
            }
          }
        } while (changed);
        map[k] = list.filter((x) => !toDelete.has(x.id));
        writeComments(map);
        return { data: true };
      },
      invalidatesTags: (r, e, arg) => [{ type: 'Comments', id: keyFor(arg?.pokemon) }, 'Threads'],
    }),

    // ----- Respuestas  -----
    addReply: builder.mutation({
      queryFn: async ({ pokemon, parentId, name, email, body }) => {
        const k = keyFor(pokemon);
        const map = readComments();
        const list = map[k] || [];
        const parent = list.find((x) => x.id === parentId);
        if (!parent) return { error: { status: 404, message: 'Parent not found' } };
        const depth = Math.min((parent.depth ?? 0) + 1, 4); 
        const item = {
          id: now(),
          pokemon: k,
          title: '',
          name: sanitize(name),
          email: sanitize(email),
          body: sanitize(body),
          parentId,
          depth,
          createdAt: now(),
          updatedAt: now(),
        };
        map[k] = [...list, item];
        writeComments(map);
        return { data: item };
      },
      invalidatesTags: ['Threads', (r, e, arg) => ({ type: 'Comments', id: keyFor(arg?.pokemon) })],
    }),

    // ----- Discusiones globales -----
    getAllTopLevelComments: builder.query({
      queryFn: async () => {
        const map = readComments();
        const all = Object.entries(map)
          .flatMap(([pokemon, list]) =>
            (list || []).filter(c => c.parentId == null)
              .map(c => ({ ...c, pokemon })) 
          )
          .sort((a,b)=> b.createdAt - a.createdAt);
        return { data: all };
      },
      providesTags: ['Threads'],
    }),

    getThreadById: builder.query({
      // arg: { pokemon, id }
      queryFn: async ({ pokemon, id }) => {
        const k = keyFor(pokemon);
        const list = readComments()[k] || [];
        const tree = buildThread(list, id);
        if (!tree) return { error: { status: 404, message: 'Not found' } };
        return { data: tree };
      },
      providesTags: (r, e, arg) => ['Threads', { type: 'Comments', id: keyFor(arg?.pokemon) }],
    }),
  }),
});

export const {
  useGetRulesQuery,
  useSetRulesMutation,
  useGetCommentsByPokemonQuery,
  useAddCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useAddReplyMutation,
  useGetAllTopLevelCommentsQuery,
  useGetThreadByIdQuery,
} = localApi;