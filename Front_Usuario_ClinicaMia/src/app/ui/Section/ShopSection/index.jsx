'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import ProductCard from '@/app/ui/ProductCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ShopSection() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0, page: 1, limit: 12 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name_asc');
  const [page, setPage] = useState(1);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/shop/categories`);
        const data = await response.json();
        if (data.success) {
          setCategories(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '12');
      params.append('sort', sortBy);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${API_URL}/api/v1/shop/products?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setProducts(data.data || []);
        setPagination(data.pagination || { total: 0, totalPages: 0, page: 1, limit: 12 });
      } else {
        setError(data.message || 'Error al cargar productos');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  }, [page, sortBy, selectedCategory, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle search with debounce
  const [searchTimeout, setSearchTimeout] = useState(null);
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Debounce search
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {
      setPage(1);
    }, 300));
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  return (
    <div className="container">
      <div className="row">
        {/* Sidebar - Filtros */}
        <div className="col-lg-3">
          <div className="cs_shop_sidebar">
            {/* Buscador */}
            <div className="cs_shop_search cs_white_bg cs_radius_15 mb-4" style={{ padding: '20px' }}>
              <h3 className="cs_fs_24 cs_semibold mb-3">Buscar Productos</h3>
              <div className="cs_search_box" style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="cs_form_field"
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 16px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '14px',
                  }}
                />
                <button
                  className="cs_search_btn"
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#53B896',
                    cursor: 'pointer',
                  }}
                >
                  <Icon icon="eva:search-outline" style={{ fontSize: '20px' }} />
                </button>
              </div>
            </div>

            {/* Categorías */}
            <div className="cs_shop_categories cs_white_bg cs_radius_15 mb-4" style={{ padding: '20px' }}>
              <h3 className="cs_fs_24 cs_semibold mb-3">Categorías</h3>
              <ul className="cs_category_list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li
                  className={!selectedCategory ? 'active' : ''}
                  onClick={() => handleCategoryChange(null)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    backgroundColor: !selectedCategory ? '#e8f5f1' : 'transparent',
                    color: !selectedCategory ? '#53B896' : '#666',
                    fontWeight: !selectedCategory ? 600 : 400,
                    marginBottom: '6px',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon icon="ic:outline-grid-view" style={{ fontSize: '18px' }} />
                  <span>Todos los Productos</span>
                </li>
                {categories.map(category => (
                  <li
                    key={category.id}
                    className={selectedCategory === category.id ? 'active' : ''}
                    onClick={() => handleCategoryChange(category.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      backgroundColor: selectedCategory === category.id ? '#e8f5f1' : 'transparent',
                      color: selectedCategory === category.id ? '#53B896' : '#666',
                      fontWeight: selectedCategory === category.id ? 600 : 400,
                      marginBottom: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: category.color || '#53B896',
                      }}
                    />
                    <span style={{ flex: 1 }}>{category.name}</span>
                    <span
                      style={{
                        backgroundColor: '#f3f4f6',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#666',
                      }}
                    >
                      {category.productCount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Información de contacto */}
            <div className="cs_shop_info cs_white_bg cs_radius_15" style={{ padding: '20px', textAlign: 'center' }}>
              <div
                className="cs_shop_info_icon"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#e8f5f1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Icon icon="eva:phone-call-outline" style={{ fontSize: '28px', color: '#53B896' }} />
              </div>
              <h3 className="cs_fs_24 cs_semibold mb-2">¿Necesitas Ayuda?</h3>
              <p className="mb-2" style={{ color: '#666' }}>Contáctanos para asesoría</p>
              <p className="cs_accent_color cs_semibold" style={{ color: '#53B896' }}>
                324 333 8555 <br />
                324 333 8686
              </p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="col-lg-9">
          {/* Header con ordenamiento */}
          <div
            className="cs_shop_header cs_white_bg cs_radius_15 mb-4"
            style={{
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div className="cs_shop_result">
              <p style={{ margin: 0, color: '#666' }}>
                Mostrando <strong>{products.length}</strong> de <strong>{pagination.total}</strong> productos
              </p>
            </div>
            <div className="cs_shop_sort" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ color: '#666', fontSize: '14px' }}>Ordenar por:</label>
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="cs_form_field"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="name_asc">Nombre (A-Z)</option>
                <option value="price_asc">Precio: Menor a Mayor</option>
                <option value="price_desc">Precio: Mayor a Menor</option>
                <option value="newest">Más Recientes</option>
              </select>
            </div>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div
              className="cs_shop_empty cs_white_bg cs_radius_15 text-center"
              style={{ padding: '60px' }}
            >
              <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
              <p className="mt-3">Cargando productos...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="cs_shop_empty cs_white_bg cs_radius_15 text-center"
              style={{ padding: '60px' }}
            >
              <Icon icon="mdi:alert-circle-outline" style={{ fontSize: '48px', color: '#f59e0b' }} />
              <h3 className="cs_fs_24 mt-3 mb-2">Error al cargar productos</h3>
              <p>{error}</p>
              <button
                onClick={fetchProducts}
                style={{
                  marginTop: '16px',
                  padding: '10px 24px',
                  backgroundColor: '#53B896',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Grid de productos */}
          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="row cs_gap_y_40">
                {products.map(product => (
                  <div key={product.id} className="col-lg-4 col-md-6">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div
                  className="cs_pagination_wrap mt-5"
                  style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}
                >
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      background: page === 1 ? '#f5f5f5' : '#fff',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Icon icon="mdi:chevron-left" />
                  </button>

                  {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        style={{
                          padding: '10px 16px',
                          border: '1px solid',
                          borderColor: page === pageNum ? '#53B896' : '#ddd',
                          borderRadius: '8px',
                          background: page === pageNum ? '#53B896' : '#fff',
                          color: page === pageNum ? '#fff' : '#333',
                          cursor: 'pointer',
                          fontWeight: page === pageNum ? 600 : 400,
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    style={{
                      padding: '10px 16px',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      background: page === pagination.totalPages ? '#f5f5f5' : '#fff',
                      cursor: page === pagination.totalPages ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Icon icon="mdi:chevron-right" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!isLoading && !error && products.length === 0 && (
            <div
              className="cs_shop_empty cs_white_bg cs_radius_15 text-center"
              style={{ padding: '60px' }}
            >
              <Icon
                icon="fluent:box-search-24-regular"
                style={{ fontSize: '72px', color: '#53B896', marginBottom: '20px' }}
              />
              <h3 className="cs_fs_32 mb-2">No se encontraron productos</h3>
              <p>Intenta con otra búsqueda o categoría</p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory(null);
                  }}
                  style={{
                    marginTop: '20px',
                    padding: '12px 24px',
                    backgroundColor: '#53B896',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
