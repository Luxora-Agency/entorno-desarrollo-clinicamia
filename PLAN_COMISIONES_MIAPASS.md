# 🚀 Plan de Implementación: Módulo de Ventas y Comisiones MIA PASS

## 📋 Resumen del Proyecto
Desarrollo de un sistema de tracking de ventas y motor de liquidación de comisiones para la membresía MIA PASS, basado en las políticas vigentes 2026.

## 🏗️ Fases de Desarrollo

### Fase 1: Modelo de Datos (Prisma)
- [ ] **Extensión de Usuario/Vendedor**: Agregar campos para código de vendedor (cédula), tipo (Interno/Externo/Referidor) y relación de `vendedorPadre` para multinivel.
- [ ] **Modelo `MiaPassVenta`**: Registrar cada venta con ID único, base, IVA, total, canal (Presencial, WhatsApp, Web, Redes Sociales, etc.) y estado.
- [ ] **Modelo `MiaPassComision`**: Almacenar la liquidación calculada por cada venta, permitiendo múltiples beneficiarios por venta (Vendedor, Referidor N1, Referidor N2, Director, CM).
- [ ] **Modelo `MiaPassCorte`**: Para cierres mensuales y actas de liquidación.

### Fase 2: Backend - Motor de Comisiones (Logic Layer)
- [ ] **Calculador de Escalafón Vendedores**: 25% ($49,976) para ventas 1-30, 30% ($59,970) para 31+.
- [ ] **Lógica Multinivel (Referidos)**:
    - [ ] Pago Nivel 1 (Directo): $10,000.
    - [ ] Pago Nivel 2 (Indirecto): $5,000.
- [ ] **Lógica de Canales Especiales (Redes Sociales)**:
    - [ ] Atribución automática: Director Comercial (10%) y Community Manager (5%).
- [ ] **Lógica Global**: Comisión para Director Comercial y Gerente sobre el gran total de ventas activas.
- [ ] **Validación de Estados**: Solo liquidar sobre estado `ACTIVA`.
- [ ] **Sistema de Reversos**: Descuento automático en el siguiente corte si una venta liquidada se anula.

### Fase 3: API REST (Hono.js)
- [ ] `POST /miapass/ventas`: Registro con atribución de código y canal.
- [ ] `GET /miapass/vendedores/arbol`: Visualización de red de referidos.
- [ ] `GET /miapass/admin/reporte-comisiones`: Consolidado mensual para tesorería.

### Fase 4: Frontend - Dashboard Comercial (Next.js)
- [ ] **Panel del Vendedor/Referidor**:
    - [ ] Mis ventas propias.
    - [ ] Ventas de mi red (N1 y N2).
    - [ ] Barra de progreso meta 30.
- [ ] **Panel Administrativo**:
    - [ ] Configuración de porcentajes y bases (Base $199,900).
    - [ ] Conciliación de pagos (CRM vs Banco).
- [ ] **Generador de Certificados (Anexo A)**: Aceptación legal de políticas.

## 📐 Reglas de Negocio Consolidadas (v1.1)
| Rol / Nivel | Tipo / Condición | Valor / % |
| :--- | :--- | :--- |
| **Vendedor** | Ventas 1 a 30 | 25% ($49,976) |
| **Vendedor** | Ventas 31 en adelante | 30% ($59,970) |
| **Referidor N1** | Venta de hijo directo | $10,000 |
| **Referidor N2** | Venta de nieto | $5,000 |
| **Director Comercial** | Sobre Total Ventas | % por definir (v1.1) |
| **Director Comercial** | Sobre Ventas Redes | 10% ($19,990) |
| **Community Manager** | Sobre Ventas Redes | 5% ($9,995) |
| **Gerente** | Sobre Total Ventas | % por definir (v1.1) |

## 🛡️ Seguridad y Auditoría
- Logs de cambios de estado en ventas.
- Restricción de edición de código de vendedor tras activación.
- Reportes exportables para soporte de pago (Cruce CRM vs Contabilidad).
