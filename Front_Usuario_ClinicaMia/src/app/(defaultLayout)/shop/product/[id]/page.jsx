'use client'

import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Section from '@/app/ui/Section';
import Breadcrumb from '@/app/ui/Breadcrumb';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProductDetail({ params }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('descripcion');
  const { addItem, formatPrice } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/v1/shop/products/${params.id}`);
        const data = await response.json();

        if (data.success) {
          setProduct(data.data);
        } else {
          setError(data.message || 'Producto no encontrado');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = () => {
    if (!product) return;

    addItem({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.image,
      stock: product.stock,
    }, quantity);

    toast.success(`${product.name} agregado al carrito`, {
      icon: '🛒',
      style: {
        borderRadius: '10px',
        background: '#333',
        color: '#fff',
      },
    });
    setQuantity(1);
  };

  // Loading state
  if (loading) {
    return (
      <Section topMd={170} bottomMd={96} bottomLg={70}>
        <div className="container">
          <div className="text-center" style={{ padding: '80px 20px' }}>
            <Icon icon="svg-spinners:ring-resize" style={{ fontSize: '48px', color: '#53B896' }} />
            <p className="mt-3">Cargando producto...</p>
          </div>
        </div>
      </Section>
    );
  }

  // Error or not found
  if (error || !product) {
    return (
      <Section topMd={170} bottomMd={96} bottomLg={70}>
        <div className="container">
          <div className="text-center" style={{ padding: '80px 20px' }}>
            <Icon icon="fluent:box-search-24-regular" style={{ fontSize: '72px', color: '#53B896', marginBottom: '20px' }} />
            <h2 className="cs_fs_40 cs_semibold mb-3">Producto no encontrado</h2>
            <p className="text-muted mb-4">{error || 'El producto que buscas no está disponible.'}</p>
            <Link href="/shop" className="cs_btn cs_style_1">
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <>
      <Breadcrumb title={product.name} />

      <Section
        topMd={200}
        topLg={150}
        topXl={100}
        bottomMd={200}
        bottomLg={150}
        bottomXl={110}
      >
        <div className="container">
          <div className="row cs_gap_y_50">
            {/* Imagen del Producto */}
            <div className="col-lg-5">
              <div className="cs_product_detail_img cs_white_bg cs_radius_20" style={{
                padding: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                position: 'relative',
              }}>
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={400}
                    style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '400px' }}
                  />
                ) : (
                  <Icon icon="healthicons:medicines" style={{ fontSize: '150px', color: '#53B896', opacity: 0.5 }} />
                )}
                {product.stock < 10 && product.stock > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: '#f59e0b',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    ¡Últimas {product.stock} unidades!
                  </div>
                )}
                {product.stock === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '15px',
                    right: '15px',
                    background: '#ef4444',
                    color: '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}>
                    Agotado
                  </div>
                )}
              </div>
            </div>

            {/* Información del Producto */}
            <div className="col-lg-7">
              <div className="cs_product_detail_info">
                {/* Header */}
                <div style={{ marginBottom: '30px' }}>
                  {product.category && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 14px',
                      borderRadius: '20px',
                      backgroundColor: product.category.color || '#53B896',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: '16px',
                    }}>
                      <Icon icon="eva:pricetag-outline" />
                      <span>{product.category.name}</span>
                    </div>
                  )}

                  <h1 className="cs_fs_48 cs_semibold" style={{ marginBottom: '16px' }}>
                    {product.name}
                  </h1>

                  {product.presentation && (
                    <p style={{ color: '#666', fontSize: '16px', marginBottom: '16px' }}>
                      {product.presentation}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '36px', fontWeight: 700, color: '#53B896' }}>
                      {formatPrice(product.price)}
                    </span>
                    <span style={{ color: '#999', fontSize: '14px' }}>/ unidad</span>
                  </div>

                  <p style={{ color: '#666', lineHeight: '1.7' }}>
                    {product.description}
                  </p>
                </div>

                {/* Info Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '12px',
                  marginBottom: '30px',
                }}>
                  {product.laboratory && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '14px',
                      borderRadius: '12px',
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Laboratorio</p>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e' }}>{product.laboratory}</p>
                    </div>
                  )}
                  {product.activeIngredient && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '14px',
                      borderRadius: '12px',
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Principio Activo</p>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e' }}>{product.activeIngredient}</p>
                    </div>
                  )}
                  {product.concentration && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '14px',
                      borderRadius: '12px',
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Concentración</p>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e' }}>{product.concentration}</p>
                    </div>
                  )}
                  {product.administrationRoute && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '14px',
                      borderRadius: '12px',
                    }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Vía</p>
                      <p style={{ margin: 0, fontWeight: 600, color: '#1a1a2e' }}>{product.administrationRoute}</p>
                    </div>
                  )}
                </div>

                {/* Stock & Actions */}
                <div style={{
                  backgroundColor: '#f8f9fa',
                  padding: '24px',
                  borderRadius: '16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <Icon icon="eva:cube-outline" style={{ fontSize: '20px', color: '#53B896' }} />
                    <span style={{ color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {product.stock > 0 ? `${product.stock} unidades disponibles` : 'Sin stock'}
                    </span>
                  </div>

                  {product.stock > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: '#fff',
                        borderRadius: '10px',
                        padding: '4px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          style={{
                            width: '40px',
                            height: '40px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: quantity <= 1 ? '#f3f4f6' : '#fff',
                            cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon icon="eva:minus-outline" />
                        </button>
                        <span style={{
                          minWidth: '50px',
                          textAlign: 'center',
                          fontSize: '18px',
                          fontWeight: 600,
                        }}>{quantity}</span>
                        <button
                          onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                          disabled={quantity >= product.stock}
                          style={{
                            width: '40px',
                            height: '40px',
                            border: 'none',
                            borderRadius: '8px',
                            backgroundColor: quantity >= product.stock ? '#f3f4f6' : '#fff',
                            cursor: quantity >= product.stock ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon icon="eva:plus-outline" />
                        </button>
                      </div>

                      <button
                        onClick={handleAddToCart}
                        className="cs_btn cs_style_1"
                        style={{
                          flex: 1,
                          minWidth: '200px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '10px',
                        }}
                      >
                        <Icon icon="eva:shopping-cart-outline" style={{ fontSize: '20px' }} />
                        <span>Agregar al Carrito</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled
                      style={{
                        width: '100%',
                        padding: '16px',
                        backgroundColor: '#9ca3af',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'not-allowed',
                      }}
                    >
                      No Disponible
                    </button>
                  )}
                </div>

                {/* SKU */}
                {product.sku && (
                  <p style={{ marginTop: '16px', color: '#999', fontSize: '13px' }}>
                    SKU: {product.sku}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Back Button */}
          <div style={{ marginTop: '60px', textAlign: 'center' }}>
            <Link
              href="/shop"
              className="cs_btn cs_style_2"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Icon icon="eva:arrow-back-outline" />
              <span>Volver a la Tienda</span>
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
