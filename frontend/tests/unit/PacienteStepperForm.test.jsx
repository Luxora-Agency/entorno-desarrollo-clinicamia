import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PacienteStepperForm from '@/components/clinica/PacienteStepperForm';

// Mock UI components that might cause issues in JSDOM
// Note: We are using the real components mostly, but Radix UI Select can be tricky in tests.

// Mock hooks
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Data
jest.mock('@/data/colombia.json', () => ({
  departamentos: [
    { id: '01', nombre: 'Antioquia', municipios: ['Medellín', 'Bello'] },
    { id: '02', nombre: 'Cundinamarca', municipios: ['Bogotá', 'Soacha'] }
  ]
}));

jest.mock('@/data/paises.json', () => [
  'Colombia',
  'Estados Unidos',
  'España'
]);

describe('PacienteStepperForm - Ubicación', () => {
  const mockUser = { id: 1, name: 'Test User' };

  it('debe mostrar Colombia por defecto en País de Nacimiento', () => {
    render(<PacienteStepperForm user={mockUser} />);
    
    // El texto "Colombia" debe estar presente.
    // Puede haber múltiples instancias, pero al menos una visible.
    const colombiaElements = screen.getAllByText('Colombia');
    expect(colombiaElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar lista de departamentos cuando País es Colombia', async () => {
    render(<PacienteStepperForm user={mockUser} />);
    
    // Si País es Colombia (default), debemos ver el Select de Departamento.
    // El Select de departamento tiene un placeholder "Seleccionar..." si está vacío.
    // O podemos buscar por el texto del label "Departamento *"
    
    const deptLabel = screen.getByText('Departamento *');
    expect(deptLabel).toBeInTheDocument();
    
    // Verificamos que NO hay un input de texto con placeholder "Estado / Provincia"
    const deptInput = screen.queryByPlaceholderText('Estado / Provincia');
    expect(deptInput).not.toBeInTheDocument();
  });

  it('debe cambiar a Input de texto cuando el país no es Colombia', async () => {
    const user = userEvent.setup();
    render(<PacienteStepperForm user={mockUser} />);

    // 1. Encontrar el trigger de País. Tiene el texto "Colombia".
    // Buscamos entre los comboboxes el que tiene "Colombia"
    const triggers = screen.getAllByRole('combobox');
    const paisTrigger = triggers.find(t => t.textContent.includes('Colombia'));
    
    expect(paisTrigger).toBeDefined();
    
    await user.click(paisTrigger);

    // 2. Seleccionar "Estados Unidos"
    // Radix UI renders both a hidden select option and a visible item.
    // We target the visible item with role "option".
    const usaOption = await screen.findByRole('option', { name: 'Estados Unidos' });
    await user.click(usaOption);

    // 3. Verificar que Departamento ahora es un Input
    // El input tiene placeholder "Estado / Provincia"
    const deptInput = await screen.findByPlaceholderText('Estado / Provincia');
    expect(deptInput).toBeInTheDocument();
    expect(deptInput.tagName).toBe('INPUT');
    
    // 4. Verificar que Municipio también es un Input
    const munInput = await screen.findByPlaceholderText('Ciudad / Municipio');
    expect(munInput).toBeInTheDocument();
  });
});
