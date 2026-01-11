import React from 'react';
import { Icon } from '@iconify/react';

const StepIndicator = ({ currentStep, totalSteps, onStepClick }) => {
  const steps = [
    { number: 1, label: 'Información Personal' },
    { number: 2, label: 'Selección Médica' },
    { number: 3, label: 'Fecha y Hora' },
    { number: 4, label: 'Confirmación' },
  ];

  return (
    <nav aria-label="Progreso del formulario" className="step-indicator">
      <ol className="steps-list">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isPending = step.number > currentStep;

          return (
            <li
              key={step.number}
              className={`step-item ${isCompleted ? 'completed' : ''} ${
                isCurrent ? 'active' : ''
              } ${isPending ? 'pending' : ''}`}
              aria-current={isCurrent ? 'step' : false}
            >
              {isCompleted ? (
                <button
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.number)}
                  className="step-button"
                  aria-label={`Volver al Paso ${step.number} de ${totalSteps}, ${step.label}, Completado`}
                >
                  <span className="step-number">
                    <Icon icon="fa6-solid:check" />
                  </span>
                  <span className="step-label">{step.label}</span>
                </button>
              ) : (
                <span
                  className="step-content"
                  aria-label={`Paso ${step.number} de ${totalSteps}, ${step.label}, ${
                    isCurrent ? 'Actual' : 'Pendiente'
                  }`}
                >
                  <span className="step-number">{step.number}</span>
                  <span className="step-label">{step.label}</span>
                </span>
              )}
              {index < steps.length - 1 && (
                <div className="step-connector" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
      <div
        role="progressbar"
        aria-valuenow={Math.round((currentStep / totalSteps) * 100)}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label={`Progreso general: ${Math.round((currentStep / totalSteps) * 100)}%`}
        className="progress-bar-sr-only"
      />
    </nav>
  );
};

export default StepIndicator;
