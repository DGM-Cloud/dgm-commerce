"use client";

import React from "react";

interface ProductsHeroProps {
  stats: Array<{
    number: string;
    text: string;
  }>;
}

const ProductsHero: React.FC<ProductsHeroProps> = ({ stats }) => {
  return (
    <section className="relative py-20 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6">
            <span className="text-sm font-semibold uppercase tracking-wider text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              Catálogo
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-black mb-8 leading-tight">
            Nuestros
            <br />
            <span className="text-gray-400">Productos</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 leading-relaxed mb-12">
            Descubre nuestra colección completa de prendas personalizadas únicas. 
            Desde polos casuales hasta hoodies premium.
          </p>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-black mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductsHero;
