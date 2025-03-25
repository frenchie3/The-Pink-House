"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Password input component with real-time validation feedback
 * Shows password requirements and strength indicator
 */
export default function PasswordInput({ required = false }) {
  const [password, setPassword] = useState("");
  const [showRequirements, setShowRequirements] = useState(false);

  // Password validation rules with detailed requirements
  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, message: "At least 8 characters" },
      { met: /[A-Z]/.test(password), message: "At least one uppercase letter" },
      { met: /[a-z]/.test(password), message: "At least one lowercase letter" },
      { met: /[0-9]/.test(password), message: "At least one number" }
    ];
    
    return requirements;
  };
  
  // Calculate password strength for the progress bar
  const calculatePasswordStrength = (password: string) => {
    if (!password) return 0;
    const requirements = validatePassword(password);
    const metCount = requirements.filter(req => req.met).length;
    return (metCount / requirements.length) * 100;
  };
  
  // Get CSS color for password strength
  const getStrengthColor = (strength: number) => {
    if (strength < 40) return "bg-red-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthColor = getStrengthColor(passwordStrength);
  const requirements = validatePassword(password);

  return (
    <div className="space-y-2">
      <Input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onFocus={() => setShowRequirements(true)}
        placeholder="Your password"
        required={required}
        className="w-full"
      />
      
      {showRequirements && password && (
        <div className="mt-2 space-y-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Password strength</Label>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${strengthColor}`} 
                style={{ width: `${passwordStrength}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Requirements:</Label>
            <ul className="text-xs space-y-1.5 mt-1">
              {requirements.map((req, index) => (
                <li key={index} className={req.met ? "text-green-600" : "text-muted-foreground flex items-center"}>
                  {req.met ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0" />
                    </svg>
                  )}
                  {req.message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 