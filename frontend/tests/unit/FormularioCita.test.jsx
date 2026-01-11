import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import FormularioCita from '@/components/clinica/FormularioCita';
import { useToast } from '@/hooks/use-toast';

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

// Mock Lucide icons to avoid rendering issues
jest.mock('lucide-react', () => ({
  FileText: () => <div data-testid="icon-file-text" />,
  Stethoscope: () => <div data-testid="icon-stethoscope" />,
  TestTube: () => <div data-testid="icon-test-tube" />,
  Activity: () => <div data-testid="icon-activity" />,
}));

// Mock fetch
global.fetch = jest.fn();

const mockToast = jest.fn();

describe('FormularioCita', () => {
  beforeEach(() => {
    useToast.mockReturnValue({ toast: mockToast });
    jest.clearAllMocks();

    // Mock initial data responses
    global.fetch.mockImplementation((url) => {
      if (url.includes('/especialidades')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [{ id: 'esp1', titulo: 'Cardiología', duracionMinutos: 30, costoCOP: 100000 }]
          })
        });
      }
      if (url.includes('/examenes-procedimientos')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [{ id: 'exa1', nombre: 'Examen Sangre', tipo: 'Examen', duracionMinutos: 15, costoBase: 50000 }]
          })
        });
      }
      if (url.includes('/pacientes')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [{ id: 'pac1', nombre: 'Juan', apellido: 'Perez', cedula: '12345', eps: 'Sanitas' }]
          })
        });
      }
      if (url.includes('/doctores')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: [{ id: 'doc1', usuarioId: 'user1', nombre: 'Dr. House', apellido: '', especialidades: ['Cardiología'] }]
          })
        });
      }
      if (url.includes('/agenda/bloques')) {
        return Promise.resolve({
          json: () => Promise.resolve({
            success: true,
            data: {
              bloques: {
                bloques: [{ hora: '10:00', estado: 'disponible', duracion: 30 }]
              }
            }
          })
        });
      }
      return Promise.resolve({
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });
  });

  test('renders correctly and loads initial data', async () => {
    await act(async () => {
      render(<FormularioCita />);
    });

    expect(screen.getByText('Tipo de Consulta *')).toBeInTheDocument();
    
    // Verify initial data load triggers (fetch calls)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/especialidades'), expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/pacientes'), expect.any(Object));
  });

  test('validates required fields on submit', async () => {
    await act(async () => {
      render(<FormularioCita />);
    });

    const submitBtn = screen.getByText('Guardar Cita');
    
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    // Check for validation messages
    // Note: Zod messages from the schema
    // "Debe seleccionar un servicio" appears if tipoCita is selected but service isn't.
    // If tipoCita is not selected, the enum validation might fail or just "required".
    // Actually, react-hook-form with zodResolver should show errors.
    
    // Since we didn't select "Tipo de Consulta", schema validation fails for tipoCita (enum).
    // The schema says: tipoCita: z.enum(...)
    // If empty string is passed (default), it fails validation.
    // We should check if error message is displayed.
    // The component has: {errors.tipoCita && <p...>{errors.tipoCita.message}</p>}
    
    // Wait for validation to happen
    await waitFor(() => {
        // Zod default error for enum mismatch might be "Invalid enum value" or custom if we added one.
        // In the schema: z.enum(...) doesn't have a custom required message in the definition I saw earlier, 
        // but let's check what I wrote.
        // `tipoCita: z.enum(['Especialidad', 'Examen', 'Procedimiento'])`
        // If value is empty string, it's invalid.
        // Let's check for any error message text appearing.
        // Or we can fill one field and see others fail.
    });
    
    // Let's try to find any error text.
    // Since I'm not sure of the exact default Zod error message for enum, 
    // I'll check "La fecha es requerida" which I explicitly added.
    expect(await screen.findByText('La fecha es requerida')).toBeInTheDocument();
  });

  test('allows filling the form and submitting', async () => {
    const onSuccess = jest.fn();
    
    await act(async () => {
      render(<FormularioCita onSuccess={onSuccess} />);
    });

    // 1. Select Tipo Cita
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: /Tipo de Consulta/i }), { target: { value: 'Especialidad' } });
    });

    // 2. Select Servicio (wait for it to appear)
    await waitFor(() => screen.getByText('Servicio *'));
    await act(async () => {
      fireEvent.change(screen.getByRole('combobox', { name: /Servicio/i }), { target: { value: 'esp1' } });
    });

    // 3. Select Paciente
    // Input for search
    const pacienteInput = screen.getByPlaceholderText('Buscar paciente...');
    await act(async () => {
      fireEvent.change(pacienteInput, { target: { value: 'Juan' } });
      fireEvent.focus(pacienteInput);
    });
    
    // Click on result
    await waitFor(() => screen.getByText('Juan Perez'));
    await act(async () => {
      fireEvent.click(screen.getByText('Juan Perez'));
    });

    // 4. Select Fecha
    const fechaInput = screen.getByLabelText('Fecha *');
    await act(async () => {
      fireEvent.change(fechaInput, { target: { value: '2025-12-20' } });
    });

    // 5. Select Hora (wait for blocks to load)
    await waitFor(() => screen.getByText('10:00'));
    await act(async () => {
      fireEvent.click(screen.getByText('10:00'));
    });

    // 6. Fill Duracion and Costo (should be auto-filled but let's ensure)
    expect(screen.getByLabelText('Duración *')).toHaveValue(30);
    expect(screen.getByLabelText('Costo (COP) *')).toHaveValue(100000);

    // 7. Submit
    const submitBtn = screen.getByText('Guardar Cita');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/citas'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"paciente_id":"pac1"')
        })
      );
    });

    expect(onSuccess).toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: '✅ Cita guardada' }));
  });
});
