import { SignUp } from '@clerk/clerk-react';
import React from 'react';

export const SignUpPage: React.FC = () => {
  return (
    <SignUp
      routing="path"
      path="/sign-up"
      signInUrl="/sign-in"
      appearance={{
        elements: {
          card: 'bg-transparent shadow-none',
          headerTitle: 'text-white',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700',
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-white',
          formFieldLabel: 'text-slate-300',
          formFieldInput: 'bg-slate-800 border-slate-700 text-white focus:ring-primary',
          footerActionText: 'text-slate-400',
          footerActionLink: 'text-primary hover:text-primary/90',
        },
      }}
    />
  );
};
export default SignUpPage;
