import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import PokemonList from './pages/PokemonList';
import PokemonDetail from './pages/PokemonDetail';
import Rules from './pages/Rules';
import Discussions from './pages/Discussions';
import DiscussionDetail from './pages/DiscussionDetail';

export default function App() {
  return (
    <div className="min-h-screen transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<PokemonList />} />
          <Route path="/pokemon/:name" element={<PokemonDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/discussions" element={<Discussions />} />
          <Route path="/discussion/:pokemon/:id" element={<DiscussionDetail />} />
        </Routes>
      </main>
    </div>
  );
}