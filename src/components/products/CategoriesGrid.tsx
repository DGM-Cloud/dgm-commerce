"use client";

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Category {
  id: string;
  name: string;
  description: string;
  image: string;
  icon: IconDefinition;
  link: string;
  count: number;
  badge?: string;
}

interface CategoriesGridProps {
  categories: Category[];
}

const CategoriesGrid: React.FC<CategoriesGridProps> = ({ categories }) => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Categorías
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explora nuestras categorías y encuentra el estilo perfecto para ti
          </p>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category) => (
            <Link key={category.id} href={category.link}>
              <div className="group relative overflow-hidden rounded-2xl bg-white hover:shadow-xl transition-all duration-500">
                <div className="relative h-80 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  
                  {category.badge && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-black text-white text-sm font-bold rounded-full">
                        {category.badge}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-4 left-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={category.icon} className="text-2xl text-white" />
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-3xl font-bold mb-2">{category.name}</h3>
                  <p className="text-white/90 mb-4">{category.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      {category.count} productos
                    </span>
                    <div className="flex items-center gap-2 text-sm font-medium group-hover:gap-4 transition-all">
                      <span>Explorar</span>
                      <FontAwesomeIcon icon={faArrowRight} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesGrid;
