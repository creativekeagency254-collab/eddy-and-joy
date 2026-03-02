import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { FirebaseApp } from 'firebase/app';

export interface UserInfo {
  providerId: string;
  uid: string;
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  providerData: UserInfo[];
  tenantId: string | null;
}

export interface Auth {
  currentUser: User | null;
  signOut: () => Promise<void>;
}

export interface UserCredential {
  user: User | null;
}

type AuthStateCallback = (user: User | null) => void;
type AuthErrorCallback = (error: Error) => void;

const supabase = getSupabaseBrowserClient();

const authSingleton: Auth = {
  currentUser: null,
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    authSingleton.currentUser = null;
  },
};

function toFirebaseUser(user: SupabaseUser | null): User | null {
  if (!user) {
    return null;
  }

  return {
    uid: user.id,
    displayName:
      (typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name) ||
      (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === 'string' && user.user_metadata.name) ||
      null,
    email: user.email ?? null,
    emailVerified: Boolean(user.email_confirmed_at),
    phoneNumber: user.phone ?? null,
    providerData: [
      {
        providerId: (user.app_metadata?.provider as string) || 'email',
        uid: user.id,
      },
    ],
    tenantId: null,
  };
}

function syncAuthUser(session: Session | null) {
  authSingleton.currentUser = toFirebaseUser(session?.user ?? null);
}

async function withAuthResult(
  operation: Promise<{ data: { user: SupabaseUser | null; session: Session | null }; error: Error | null }>
): Promise<UserCredential> {
  const result = await operation;

  if (result.error) {
    throw result.error;
  }

  syncAuthUser(result.data.session ?? null);
  return { user: authSingleton.currentUser };
}

export function getAuth(_app?: FirebaseApp) {
  return authSingleton;
}

export function onAuthStateChanged(
  auth: Auth,
  nextOrObserver: AuthStateCallback,
  error?: AuthErrorCallback
) {
  let isActive = true;

  supabase.auth
    .getSession()
    .then(({ data, error: sessionError }) => {
      if (!isActive) {
        return;
      }

      if (sessionError) {
        if (error) {
          error(sessionError);
        }
        return;
      }

      syncAuthUser(data.session);
      nextOrObserver(auth.currentUser);
    })
    .catch((sessionError: Error) => {
      if (isActive && error) {
        error(sessionError);
      }
    });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (_event: AuthChangeEvent, session: Session | null) => {
      if (!isActive) {
        return;
      }

      syncAuthUser(session);
      nextOrObserver(auth.currentUser);
    }
  );

  return () => {
    isActive = false;
    subscription.unsubscribe();
  };
}

export function signInAnonymously(_auth: Auth) {
  return withAuthResult(supabase.auth.signInAnonymously() as any);
}

export function createUserWithEmailAndPassword(_auth: Auth, email: string, password: string) {
  return withAuthResult(supabase.auth.signUp({ email, password }) as any);
}

export function signInWithEmailAndPassword(_auth: Auth, email: string, password: string) {
  return withAuthResult(supabase.auth.signInWithPassword({ email, password }) as any);
}
