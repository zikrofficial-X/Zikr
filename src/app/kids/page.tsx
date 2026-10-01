/**
 * Kids Section - Main Page
 * v1.1.0 - Comprehensive Kids Gaming Hub
 * 
 * Features:
 * - 8 fully enhanced games with levels
 * - Beautiful UI with vibrant colors
 * - Gamification system with achievements
 * - Age-appropriate content
 * - Full Arabic and English support
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GAMES_REGISTRY, getGamesStatistics, getGamesByAgeGroup } from '@/features/kids/data/games-index';

export default function KidsPage() {
  const [selectedAge, setSelectedAge] = useState<number>(7);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('en');

  useEffect(() => {
    // Set loading to false after component mounts
    setIsLoading(false);
  }, []);

  // Filter games based on age and category
  const filteredGames = GAMES_REGISTRY.filter((game) => {
    const ageMatch = selectedAge >= game.ageMin && selectedAge <= game.ageMax;
    const categoryMatch = selectedCategory === 'all' || game.category === selectedCategory;
    return ageMatch && categoryMatch;
  });

  const stats = getGamesStatistics();
  const categoryEmojis: { [key: string]: string } = {
    action: '⚡',
    educational: '📚',
    memory: '🧠',
    puzzle: '🧩',
    creativity: '🎨',
    learning: '👨‍🎓',
  };

  const difficultyColors: { [key: string]: string } = {
    easy: 'bg-green-400',
    medium: 'bg-yellow-400',
    hard: 'bg-orange-400',
    expert: 'bg-red-400',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-100 to-green-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-purple-800">جاري التحميل...</h2>
          <p className="text-gray-600">Loading amazing games...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">🎮 {language === 'ar' ? 'قسم الأطفال' : 'Kids Zone'}</h1>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="bg-white text-purple-600 px-4 py-2 rounded-full font-bold hover:bg-purple-100 transition"
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>
          <p className="text-lg opacity-90">
            {language === 'ar'
              ? `اختر لعبتك المفضلة وابدأ المرح - ${stats.totalGames} لعبة رائعة تنتظرك!`
              : `Choose your favorite game and start the fun - ${stats.totalGames} amazing games waiting for you!`}
          </p>
        </div>
      </header>

      {/* Statistics Banner */}
      <section className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.totalGames}</div>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'ألعاب' : 'Games'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalLevels}</div>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'مستويات' : 'Levels'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.totalRewards}</div>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'نقاط' : 'Rewards'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-pink-600">{stats.uniqueCategories}</div>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'فئات' : 'Categories'}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{stats.ageRange.min}-{stats.ageRange.max}</div>
            <p className="text-sm text-gray-600">{language === 'ar' ? 'سن' : 'Age'}</p>
          </div>
        </div>
      </section>

      {/* Controls Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-6 text-purple-700">
            {language === 'ar' ? 'اختر المستوى العمري والفئة' : 'Select Age & Category'}
          </h2>
          
          {/* Age Selector */}
          <div className="mb-6">
            <label className="block text-lg font-bold text-gray-700 mb-3">
              {language === 'ar' ? 'عمرك' : 'Your Age'}: {selectedAge} {language === 'ar' ? 'سنة' : 'years'}
            </label>
            <input
              type="range"
              min="4"
              max="15"
              value={selectedAge}
              onChange={(e) => setSelectedAge(parseInt(e.target.value))}
              className="w-full h-3 bg-gradient-to-r from-purple-300 to-blue-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>4 {language === 'ar' ? 'سنوات' : 'years'}</span>
              <span>15 {language === 'ar' ? 'سنة' : 'years'}</span>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">
              {language === 'ar' ? 'نوع اللعبة' : 'Game Type'}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`p-3 rounded-lg font-bold transition transform hover:scale-105 ${
                  selectedCategory === 'all'
                    ? 'bg-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {language === 'ar' ? 'الكل' : 'All'}
              </button>
              {['action', 'educational', 'memory', 'puzzle', 'creativity', 'learning'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-lg font-bold transition transform hover:scale-105 ${
                    selectedCategory === cat
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">{categoryEmojis[cat]}</span>
                  <div className="text-xs mt-1">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Games Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-purple-700">
            {language === 'ar' 
              ? `الألعاب المناسبة (${filteredGames.length})` 
              : `Available Games (${filteredGames.length})`}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => (
              <Link
                key={game.id}
                href={`/kids/games/${game.id}`}
              >
                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:scale-105 transition cursor-pointer border-4 border-transparent hover:border-purple-300">
                  {/* Game Card Header */}
                  <div className="bg-gradient-to-r from-purple-400 to-pink-400 p-6 text-center">
                    <div className="text-6xl mb-2">{game.icon}</div>
                    <h3 className="text-2xl font-bold text-white">
                      {language === 'ar' ? game.nameAr : game.nameEn}
                    </h3>
                  </div>

                  {/* Game Card Body */}
                  <div className="p-4">
                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      {language === 'ar' ? game.descriptionAr : game.descriptionEn}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-blue-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-blue-600">{game.levels}</div>
                        <div className="text-xs text-blue-700">{language === 'ar' ? 'مستويات' : 'Levels'}</div>
                      </div>
                      <div className="bg-green-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-green-600">{game.duration}m</div>
                        <div className="text-xs text-green-700">{language === 'ar' ? 'وقت' : 'Time'}</div>
                      </div>
                      <div className="bg-yellow-100 rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-yellow-600">{game.rewards.perCompletion}</div>
                        <div className="text-xs text-yellow-700">{language === 'ar' ? 'جوائز' : 'Reward'}</div>
                      </div>
                    </div>

                    {/* Difficulty Badge */}
                    <div className={`${difficultyColors[game.difficulty]} text-white py-2 px-3 rounded-lg text-center font-bold text-sm mb-3`}>
                      {language === 'ar'
                        ? { easy: 'سهل', medium: 'متوسط', hard: 'صعب', mixed: 'مختلط' }[game.difficulty]
                        : { easy: 'Easy', medium: 'Medium', hard: 'Hard', mixed: 'Mixed' }[game.difficulty]}
                    </div>

                    {/* Age Group */}
                    <div className="bg-purple-100 rounded-lg p-2 text-center mb-3">
                      <p className="text-xs text-purple-700 font-bold">
                        {language === 'ar' 
                          ? `من ${game.ageMin} إلى ${game.ageMax} سنة`
                          : `${game.ageMin}-${game.ageMax} years old`}
                      </p>
                    </div>

                    {/* Play Button */}
                    <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition shadow-md">
                      {language === 'ar' ? '▶ العب الآن' : '▶ Play Now'}
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredGames.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😢</div>
              <p className="text-xl text-gray-600">
                {language === 'ar'
                  ? 'لا توجد ألعاب مناسبة لهذا الاختيار'
                  : 'No games match your selection'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-purple-600 to-blue-600 text-white mt-12 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-2">
            {language === 'ar'
              ? '✨ مرحباً بك في قسم الأطفال الآمن والتعليمي'
              : '✨ Welcome to our Safe & Educational Kids Zone'}
          </p>
          <p className="text-sm opacity-75">
            {language === 'ar'
              ? 'مكان آمن للأطفال للتعلم واللعب واكتشاف قيم إسلامية'
              : 'A safe place for kids to learn, play, and discover Islamic values'}
          </p>
        </div>
      </footer>
    </div>
  );
}
