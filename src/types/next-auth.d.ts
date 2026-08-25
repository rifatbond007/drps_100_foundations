/**
 * Session type augmentation for NextAuth v5.
 */
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: 'USER' | 'ADMIN';
      profileCompleted: boolean;
      languagePref: 'BN' | 'EN';
      isBanned: boolean;
    };
  }

  interface User {
    role?: 'USER' | 'ADMIN';
    profileCompleted?: boolean;
    languagePref?: 'BN' | 'EN';
    isBanned?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: 'USER' | 'ADMIN';
    profileCompleted?: boolean;
    languagePref?: 'BN' | 'EN';
    isBanned?: boolean;
    tokenVersion?: number;
    lastBanCheck?: number;
    name?: string;
    image?: string;
  }
}
