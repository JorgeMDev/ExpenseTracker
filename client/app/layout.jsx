import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ExpenseProvider } from '@/context/ExpenseContext';

export const metadata = {
  title: 'ExpenseTracker — Smart Expense Management',
  description: 'Track, categorize, and maximize your tax deductions with AI-powered expense insights.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Jost:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <ExpenseProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                style: { background: '#1e2433', color: '#f1f5f9', border: '1px solid #334155' },
                success: { iconTheme: { primary: '#10b981', secondary: '#1e2433' } },
                error: { iconTheme: { primary: '#ef4444', secondary: '#1e2433' } },
              }}
            />
          </ExpenseProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
