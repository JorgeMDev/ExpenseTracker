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
