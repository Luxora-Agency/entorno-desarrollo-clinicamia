'use client'
import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const [quantity, setQuantity] = useState(1);
  const { addItem, formatPrice } = useCart();

  const handleAddToCart = () => {
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
    setQuantity(1); // Reset quantity after adding
  };

  return (
    <div className="cs_product_card cs_white_bg cs_radius_15">
      <div className="cs_product_img">
        <div className="cs_product_img_wrapper">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={200}
              height={200}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          ) : (
            <Icon icon="healthicons:medicines" className="cs_product_placeholder" />
          )}
        </div>
        {product.stock < 10 && product.stock > 0 && (
          <div className="cs_product_badge cs_warning">
            ¡Últimas unidades!
          </div>
        )}
        {product.stock === 0 && (
          <div className="cs_product_badge cs_danger">
            Agotado
          </div>
        )}
        {product.category && (
          <div
            className="cs_product_category_badge"
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              padding: '4px 10px',
              borderRadius: '20px',
              backgroundColor: product.category.color || '#53B896',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {product.category.name}
          </div>
        )}
      </div>

      <div className="cs_product_info">
        <h3 className="cs_product_title cs_fs_20 cs_semibold">
          {product.name}
        </h3>
        {product.presentation && (
          <p className="cs_product_presentation" style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
            {product.presentation}
          </p>
        )}
        <p className="cs_product_description">
          {product.description}
        </p>

        <div className="cs_product_meta">
          <div className="cs_product_stock">
            <Icon icon="eva:cube-outline" />
            <span>{product.stock} disponibles</span>
          </div>
        </div>

        <div className="cs_product_footer">
          <div className="cs_product_price">
            <span className="cs_price">{formatPrice(product.price)}</span>
          </div>

          <div className="cs_product_buttons">
            <Link
              href={`/shop/product/${product.id}`}
              className="cs_btn cs_style_2 cs_fs_14 cs_btn_details"
            >
              <Icon icon="eva:eye-outline" />
              <span>Ver Detalles</span>
            </Link>

            {product.stock > 0 ? (
              <div className="cs_product_actions">
                <div className="cs_quantity_selector">
                  <button
                    className="cs_qty_btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Icon icon="eva:minus-outline" />
                  </button>
                  <span className="cs_qty_value">{quantity}</span>
                  <button
                    className="cs_qty_btn"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock}
                  >
                    <Icon icon="eva:plus-outline" />
                  </button>
                </div>
                <button
                  className="cs_btn cs_style_1 cs_fs_16"
                  onClick={handleAddToCart}
                >
                  <Icon icon="eva:shopping-cart-outline" />
                  <span>Agregar</span>
                </button>
              </div>
            ) : (
              <button className="cs_btn cs_style_1 cs_fs_16" disabled>
                <span>No Disponible</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
