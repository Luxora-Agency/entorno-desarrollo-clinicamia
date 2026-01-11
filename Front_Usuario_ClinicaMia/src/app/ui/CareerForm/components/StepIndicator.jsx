import React from 'react';

export default function StepIndicator({ currentStep, totalSteps, onStepClick }) {
  const steps = [
    { number: 1, title: 'Personal' },
    { number: 2, title: 'Profesional' },
    { number: 3, title: 'Laboral' },
    { number: 4, title: 'Documentos' },
    { number: 5, title: 'Confirmación' },
  ];

  return (
    <div className="cs_step_indicator">
      {steps.map((step, index) => (
        <div
          key={step.number}
          className={`cs_step_item ${currentStep === step.number ? 'active' : ''} ${
            currentStep > step.number ? 'completed' : ''
          }`}
          onClick={() => onStepClick && onStepClick(step.number)}
          style={{ cursor: onStepClick ? 'pointer' : 'default' }}
        >
          <div className="cs_step_circle">
            {currentStep > step.number ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.3337 4L6.00033 11.3333L2.66699 8"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              step.number
            )}
          </div>
          <div className="cs_step_label">{step.title}</div>
          {index < steps.length - 1 && <div className="cs_step_line" />}
        </div>
      ))}
    </div>
  );
}
