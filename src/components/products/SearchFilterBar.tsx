"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faFilter, faThLarge, faList } from "@fortawesome/free-solid-svg-icons";

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  resultsCount: number;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  viewMode,
  setViewMode,
  resultsCount
}) => {
  return (
    <section className="py-12 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 sticky top-20 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between max-w-5xl mx-auto">
          <div className="relative flex-1 w-full">
            <FontAwesomeIcon icon={faSearch} className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
            <input
              type="text"
              placeholder="¿Qué estás buscando hoy?"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-black text-2xl font-bold transition-colors"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-initial">
              <FontAwesomeIcon icon={faFilter} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full lg:w-auto pl-11 pr-10 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-black transition-all appearance-none bg-white text-gray-700 font-medium shadow-sm cursor-pointer hover:border-gray-300"
              >
                <option value="all">Todas</option>
                <option value="SuperStars">SuperStars</option>
                <option value="Romantic">Romantic</option>
                <option value="GYM">GYM</option>
              </select>
            </div>
            
            <div className="flex bg-gray-100 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === "grid" 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-600 hover:text-black hover:bg-white"
                }`}
                aria-label="Vista en cuadrícula"
              >
                <FontAwesomeIcon icon={faThLarge} className="text-lg" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all ${
                  viewMode === "list" 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-600 hover:text-black hover:bg-white"
                }`}
                aria-label="Vista en lista"
              >
                <FontAwesomeIcon icon={faList} className="text-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              <span className="font-semibold text-black">{resultsCount}</span> {resultsCount === 1 ? 'resultado' : 'resultados'} para 
              <span className="font-bold text-black"> "{searchTerm}"</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default SearchFilterBar;
