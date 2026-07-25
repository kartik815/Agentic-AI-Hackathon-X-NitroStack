import fs from 'fs';
import path from 'path';

export interface GmailConnectionState {
  connected: boolean;
  email?: string;
  refreshToken?: string;
  connectedAt?: string;
  lastSyncTime?: string;
  status?: string;
}

export class GmailService {
  private static STORAGE_DIR = path.resolve(process.cwd(), 'data');
  private static STORAGE_FILE = path.join(GmailService.STORAGE_DIR, 'gmail_connection.json');

  private static ensureStorageDir() {
    if (!fs.existsSync(this.STORAGE_DIR)) {
      fs.mkdirSync(this.STORAGE_DIR, { recursive: true });
    }
  }

  private static loadState(): GmailConnectionState {
    this.ensureStorageDir();
    if (!fs.existsSync(this.STORAGE_FILE)) {
      return { connected: false };
    }
    try {
      const raw = fs.readFileSync(this.STORAGE_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      return { connected: false };
    }
  }

  private static saveState(state: GmailConnectionState) {
    this.ensureStorageDir();
    fs.writeFileSync(this.STORAGE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Status Function: Returns public connection status (NEVER exposes refresh token to client)
   */
  static status(): { connected: boolean; email?: string; connectedAt?: string; lastSyncTime?: string; status?: string } {
    const state = this.loadState();
    if (!state.connected || !state.email) {
      return { connected: false };
    }
    return {
      connected: true,
      email: state.email,
      connectedAt: state.connectedAt,
      lastSyncTime: state.lastSyncTime || state.connectedAt,
      status: state.status || 'Active Integration'
    };
  }

  /**
   * Connect Function: Exchanges OAuth authorization code for refresh token & fetches connected email
   */
  static async connect(code: string, redirectUri: string): Promise<{ success: boolean; email?: string; message?: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables.');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[GmailService] Token exchange failed:', tokenData);
      return { success: false, message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code.' };
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    // 2. Fetch connected email address using Google UserInfo API
    let userEmail = 'doctor@gmail.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (userinfoRes.ok) {
        const userinfo = await userinfoRes.json();
        if (userinfo.email) {
          userEmail = userinfo.email;
        }
      }
    } catch (e) {
      console.warn('[GmailService] Could not fetch userinfo email, fallback to default:', e);
    }

    const now = new Date().toISOString();
    const currentState = this.loadState();

    // Preserve existing refresh token if Google didn't issue a new one in prompt
    const finalRefreshToken = refreshToken || currentState.refreshToken;

    this.saveState({
      connected: true,
      email: userEmail,
      refreshToken: finalRefreshToken,
      connectedAt: now,
      lastSyncTime: now,
      status: 'Active'
    });

    console.log(`[GmailService] ✅ Gmail connected successfully for email: ${userEmail}`);
    return { success: true, email: userEmail };
  }

  /**
   * Disconnect Function: Revokes token and removes stored credentials from server
   */
  static async disconnect(): Promise<{ success: boolean }> {
    const state = this.loadState();
    if (state.refreshToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${state.refreshToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
      } catch (e) {
        console.warn('[GmailService] Token revocation warning:', e);
      }
    }

    this.saveState({ connected: false });
    console.log('[GmailService] 🔌 Gmail integration disconnected.');
    return { success: true };
  }

  /**
   * RefreshAccessToken Function: Uses refresh token to retrieve a fresh access token for server-side operations
   */
  static async refreshAccessToken(): Promise<string | null> {
    const state = this.loadState();
    if (!state.connected || !state.refreshToken) {
      return null;
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    try {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: state.refreshToken,
          grant_type: 'refresh_token'
        })
      });

      const data = await res.json();
      if (res.ok && data.access_token) {
        // Update last sync time
        this.saveState({
          ...state,
          lastSyncTime: new Date().toISOString()
        });
        return data.access_token;
      }
    } catch (e) {
      console.error('[GmailService] Error refreshing access token:', e);
    }

    return null;
  }
}
