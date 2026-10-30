"use client";

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";

interface Collection {
  name: string;
  description: string;
  icon: IconDefinition;
  image: string;
  link: string;
  products: number;
}

interface CollectionsGridProps {
  collections: Collection[];
}

const CollectionsGrid: React.FC<CollectionsGridProps> = ({ collections }) => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Colecciones Especiales
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Diseños únicos y temáticos que cuentan una historia especial
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <Link key={index} href={collection.link}>
              <div className="group bg-gray-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="relative h-64 overflow-hidden bg-white">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                      <FontAwesomeIcon icon={collection.icon} className="text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-black">{collection.name}</h3>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{collection.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">
                      {collection.products} productos
                    </span>
                    <div className="flex items-center gap-2 text-black font-semibold group-hover:gap-4 transition-all">
                      <span>Ver más</span>
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

export default CollectionsGrid;
