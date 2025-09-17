import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = 'https://pokeapi.co/api/v2/';

const idFromUrl = (url) => {
  const m = url?.match(/\/pokemon\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
};

const officialArt = (id) =>
  id
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
    : '';

export const pokeApi = createApi({
  reducerPath: 'pokeApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Pokemon', 'PokemonList', 'PokemonIndex'],
  endpoints: (builder) => ({
    getPokemonList: builder.query({
      query: ({ limit = 24, offset = 0 } = {}) =>
        `pokemon?limit=${encodeURIComponent(limit)}&offset=${encodeURIComponent(offset)}`,
      transformResponse: (d) => {
        const items = (d?.results ?? []).map((r) => {
          const id = idFromUrl(r.url);
          return { id, name: r.name, sprites: { official: officialArt(id) } };
        });
        return { count: d?.count ?? items.length, items };
      },
    }),
    getPokemonByName: builder.query({
      query: (nameOrId) => `pokemon/${encodeURIComponent(nameOrId)}`,
      transformResponse: (d) => {
        if (!d) return null;
        const id = d.id;
        return {
          id,
          name: d.name,
          height: d.height,
          weight: d.weight,
          types: (d.types ?? []).map((t) => t.type?.name).filter(Boolean),
          abilities: (d.abilities ?? []).map((a) => a.ability?.name).filter(Boolean),
          sprites: {
            official:
              d.sprites?.other?.['official-artwork']?.front_default ||
              d.sprites?.front_default ||
              officialArt(id),
          },
          stats: (d.stats ?? []).map((s) => ({ name: s.stat?.name, base: s.base_stat })),
        };
      },
    }),
    getAllPokemonIndex: builder.query({
      query: () => `pokemon?limit=2000&offset=0`,
      transformResponse: (d) =>
        (d?.results ?? []).map((r) => {
          const id = idFromUrl(r.url);
          return { id, name: r.name };
        }),
    }),
  }),
});

export const {
  useGetPokemonListQuery,
  useGetPokemonByNameQuery,
  useGetAllPokemonIndexQuery,
} = pokeApi;