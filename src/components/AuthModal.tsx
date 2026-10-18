import React, { useState } from 'react';
import { X, Lock, ShieldAlert } from 'lucide-react';
import { authenticateUser, isFirebaseConfigured } from '../services/firebase';
import type { UserProfile } from '../types/tracking';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFirebaseConfigured) {
      setErrorMessage('Cloud synchronization is disabled because Firebase credentials are not configured in your environment.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await authenticateUser(email, password, isSignUp);
      onAuthenticated(user);
      onClose();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={16} color="var(--color-chartreuse)" />
            <h3 style={{ color: 'var(--color-ivory)', fontSize: '15px' }}>
              {isSignUp ? 'Create Field Agent Account' : 'Field Agent Authentication'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-on-dark-secondary)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {!isFirebaseConfigured ? (
            <div style={{ padding: '14px', background: '#F8F6F0', border: '1px solid #D6D2C4', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <ShieldAlert size={20} color="#8C3707" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: 'var(--color-forest)', fontSize: '13px' }}>
                    LOCAL STORAGE MODE ACTIVE
                  </strong>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    Firebase environment variables are not detected. All tracking telemetry, coordinates, and routes will be securely stored in your browser's local memory.
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                    To enable live cloud sync between your smartphone and monitoring laptop, copy <code>.env.example</code> to <code>.env</code> and add your Firebase credentials.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {errorMessage && (
                <div style={{ padding: '10px 14px', background: '#FDF0ED', color: '#B52B0E', fontSize: '12px', borderRadius: '4px', border: '1px solid #F5C5BB' }}>
                  {errorMessage}
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="auth-email">Agent Email</label>
                <input
                  id="auth-email"
                  type="email"
                  required
                  placeholder="agent@geotrack.internal"
                  className="form-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auth-password">Password</label>
                <input
                  id="auth-password"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  className="form-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-instrument btn-vermilion"
                style={{ marginTop: '8px', padding: '10px' }}
              >
                {loading ? 'Authenticating...' : isSignUp ? 'Register Agent' : 'Sign In to Console'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ background: 'none', border: 'none', color: 'var(--color-forest)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                >
                  {isSignUp
                    ? 'Already have credentials? Sign in instead'
                    : 'Need an agent account? Sign up'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-instrument">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
