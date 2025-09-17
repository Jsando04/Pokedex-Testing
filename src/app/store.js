import { configureStore } from '@reduxjs/toolkit';
import { pokeApi } from '../services/pokeApi';
import { localApi } from '../services/localApi';

export const store = configureStore({
  reducer: {
    [pokeApi.reducerPath]: pokeApi.reducer,
    [localApi.reducerPath]: localApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().concat(pokeApi.middleware, localApi.middleware),
});