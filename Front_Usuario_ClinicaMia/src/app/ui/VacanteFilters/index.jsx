'use client'

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { useDepartamentosConVacantes, TIPOS_CONTRATO } from '@/hooks/usePublicVacantes'

export default function VacanteFilters({ filters, onFilterChange }) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const { data: departamentosData } = useDepartamentosConVacantes()
  const departamentos = departamentosData?.data || []

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    onFilterChange({ search: searchValue, page: 1 })
  }

  const handleDepartamentoChange = (e) => {
    onFilterChange({ departamento: e.target.value || undefined, page: 1 })
  }

  const handleTipoContratoChange = (e) => {
    onFilterChange({ tipoContrato: e.target.value || undefined, page: 1 })
  }

  const handleClearFilters = () => {
    setSearchValue('')
    onFilterChange({
      search: undefined,
      departamento: undefined,
      tipoContrato: undefined,
      page: 1,
    })
  }

  const hasActiveFilters = filters.search || filters.departamento || filters.tipoContrato

  return (
    <div className="cs_vacante_filters">
      <div className="row g-3">
        <div className="col-lg-5 col-md-12">
          <form onSubmit={handleSearchSubmit} className="cs_filter_search">
            <Icon icon="fa6-solid:magnifying-glass" width={16} className="cs_search_icon" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Buscar por cargo, titulo o palabras clave..."
              className="cs_filter_input"
            />
            <button type="submit" className="cs_search_btn">Buscar</button>
          </form>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="cs_filter_select_wrapper">
            <Icon icon="fa6-solid:building" width={14} className="cs_select_icon" />
            <select
              value={filters.departamento || ''}
              onChange={handleDepartamentoChange}
              className="cs_filter_select"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.nombre} ({dept.vacantesCount})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="cs_filter_select_wrapper">
            <Icon icon="fa6-solid:file-contract" width={14} className="cs_select_icon" />
            <select
              value={filters.tipoContrato || ''}
              onChange={handleTipoContratoChange}
              className="cs_filter_select"
            >
              <option value="">Tipo de contrato</option>
              {TIPOS_CONTRATO.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="col-lg-1 col-md-12">
          {hasActiveFilters && (
            <button type="button" onClick={handleClearFilters} className="cs_filter_clear" title="Limpiar filtros">
              <Icon icon="fa6-solid:xmark" width={16} />
              <span className="d-lg-none ms-2">Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {hasActiveFilters && (
        <div className="cs_active_filters">
          <span className="cs_active_filters_label">Filtros activos:</span>
          {filters.search && (
            <span className="cs_filter_tag">
              <Icon icon="fa6-solid:magnifying-glass" width={10} />
              &quot;{filters.search}&quot;
              <button onClick={() => { setSearchValue(''); onFilterChange({ search: undefined, page: 1 }) }}>
                <Icon icon="fa6-solid:xmark" width={10} />
              </button>
            </span>
          )}
          {filters.departamento && (
            <span className="cs_filter_tag">
              <Icon icon="fa6-solid:building" width={10} />
              {departamentos.find(d => d.id === filters.departamento)?.nombre || 'Departamento'}
              <button onClick={() => onFilterChange({ departamento: undefined, page: 1 })}>
                <Icon icon="fa6-solid:xmark" width={10} />
              </button>
            </span>
          )}
          {filters.tipoContrato && (
            <span className="cs_filter_tag">
              <Icon icon="fa6-solid:file-contract" width={10} />
              {TIPOS_CONTRATO.find(t => t.value === filters.tipoContrato)?.label || filters.tipoContrato}
              <button onClick={() => onFilterChange({ tipoContrato: undefined, page: 1 })}>
                <Icon icon="fa6-solid:xmark" width={10} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
