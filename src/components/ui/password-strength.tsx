'use client';

import * as React from 'react';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

type PasswordStrengthProps = {
  password?: string;
};

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const [strength, setStrength] = React.useState({
    score: 0,
    label: '',
    color: '',
  });

  const checkStrength = (pass: string) => {
    let score = 0;
    const regexChecks = [
      /[a-z]/, // lowercase
      /[A-Z]/, // uppercase
      /[0-9]/, // numbers
      /[^a-zA-Z0-9]/, // special characters
    ];

    if (pass.length >= 8) {
        score += 1;
    }
    regexChecks.forEach(regex => {
        if (regex.test(pass)) {
            score += 1;
        }
    });

    if(pass.length > 0 && pass.length < 4) {
        setStrength({
            score: 0,
            label: 'Mínimo de 4 caracteres',
            color: 'bg-destructive'
        });
        return;
    }

    if (pass.length === 0) {
        setStrength({ score: 0, label: '', color: '' });
        return;
    }

    let label = 'Fraca';
    let color = 'bg-destructive';

    if (score >= 4) {
      label = 'Forte';
      color = 'bg-green-500';
    } else if (score >= 2) {
      label = 'Média';
      color = 'bg-yellow-500';
    }
    setStrength({ score: (score / 5) * 100, label, color });
  };

  React.useEffect(() => {
    if (password) {
      checkStrength(password);
    } else {
      setStrength({ score: 0, label: '', color: '' });
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <Progress value={strength.score} className={cn('h-2', strength.color)} />
      {strength.label && <p className="text-xs font-medium">{strength.label}</p>}
    </div>
  );
};
