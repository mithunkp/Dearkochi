'use server';

import { cookies } from 'next/headers';

export async function loginAdmin(username: string, password: string) {
    // const username = formData.get('username'); // Removed
    // const password = formData.get('password'); // Removed

    if (username !== 'admin') {
        return { success: false, error: 'Invalid username' };
    }

    if (password !== 'p@ssw0rd@dmin') {
        return { success: false, error: 'Invalid password' };
    }

    console.log('Login successful in server action. Setting cookie...');
    (await cookies()).set('admin_session', 'true', {
        httpOnly: true,
        secure: false, // For debugging/localhost
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
    return { success: true };
}
