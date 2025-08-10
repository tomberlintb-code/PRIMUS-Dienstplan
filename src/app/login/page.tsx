'use client';
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function LoginPage() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); router.push('/dashboard'); }
    catch (err: any) { setError(err?.code || 'Anmeldung fehlgeschlagen'); }
    finally { setLoading(false); }
  }

  return (
    <div className="container">
      <div className="card">
        <h2 className="title center">Anmeldung</h2>
        <form onSubmit={onSubmit}>
          <input className="input" type="email" placeholder="E-Mail" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="input" type="password" placeholder="Passwort" value={password} onChange={e=>setPassword(e.target.value)} required />
          <button className="button" type="submit" disabled={loading}>{loading ? 'Prüfe …' : 'Einloggen'}</button>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    </div>
  );
}
