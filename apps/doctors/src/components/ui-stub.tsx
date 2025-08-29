// Stub temporal para @altamedica/ui hasta que se resuelva el problema de resolución de módulos

// Componentes básicos stub
export const Button = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const Card = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const CardContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const CardDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;

export const CardHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const CardTitle = ({ children, ...props }: any) => <h3 {...props}>{children}</h3>;

export const CardFooter = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const Input = ({ ...props }: any) => <input {...props} />;

export const Badge = ({ children, ...props }: any) => <span {...props}>{children}</span>;

export const Progress = ({ value, ...props }: any) => (
  <div {...props}>
    <div style={{ width: `${value}%` }}></div>
  </div>
);

export const Alert = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const AlertDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;

export const Tabs = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const TabsContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const TabsList = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const TabsTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const LoadingSpinner = ({ ...props }: any) => <div {...props}>Loading...</div>;

export const Separator = ({ ...props }: any) => <hr {...props} />;

// Agregar componentes faltantes para PatientCrystalBall
export const Label = ({ children, ...props }: any) => <label {...props}>{children}</label>;

export const Textarea = ({ ...props }: any) => <textarea {...props} />;

export const ScrollArea = ({ children, ...props }: any) => (
  <div style={{ overflow: 'auto' }} {...props}>{children}</div>
);

export const AlertTitle = ({ children, ...props }: any) => <h4 {...props}>{children}</h4>;

// Agregar componentes Dialog faltantes
export const Dialog = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const DialogTrigger = ({ children, ...props }: any) => <button {...props}>{children}</button>;

export const DialogContent = ({ children, ...props }: any) => (
  <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '20px' }} {...props}>
    {children}
  </div>
);

export const DialogHeader = ({ children, ...props }: any) => <div {...props}>{children}</div>;

export const DialogTitle = ({ children, ...props }: any) => <h2 {...props}>{children}</h2>;

export const DialogDescription = ({ children, ...props }: any) => <p {...props}>{children}</p>;
