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

export interface GmailAttachmentInfo {
  attachmentId?: string;
  fileName: string;
  fileSize: string;
  mimeType?: string;
}

export interface GmailIntakeMessage {
  id: string;
  threadId: string;
  subject: string;
  sender: string;
  receivedTime: string;
  snippet: string;
  body: string;
  attachmentCount: number;
  attachments: GmailAttachmentInfo[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function parseMessageParts(part: any, result: { body: string; attachments: GmailAttachmentInfo[] }) {
  if (!part) return;

  if (part.filename && part.filename.length > 0) {
    const size = part.body?.size || 0;
    result.attachments.push({
      attachmentId: part.body?.attachmentId,
      fileName: part.filename,
      fileSize: formatBytes(size),
      mimeType: part.mimeType
    });
  } else if (part.mimeType === 'text/plain' && part.body?.data && !result.body) {
    try {
      result.body = Buffer.from(part.body.data, 'base64url').toString('utf-8');
    } catch {
      try {
        result.body = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } catch (e) {}
    }
  } else if (part.mimeType === 'text/html' && part.body?.data && !result.body) {
    try {
      const html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
      result.body = html.replace(/<[^>]*>?/gm, '');
    } catch (e) {}
  }

  if (part.parts && Array.isArray(part.parts)) {
    for (const subPart of part.parts) {
      parseMessageParts(subPart, result);
    }
  }
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

    const tokenData: any = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[GmailService] Token exchange failed:', tokenData);
      return { success: false, message: tokenData.error_description || tokenData.error || 'Failed to exchange authorization code.' };
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;

    let userEmail = 'doctor@gmail.com';
    try {
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (userinfoRes.ok) {
        const userinfo: any = await userinfoRes.json();
        if (userinfo.email) {
          userEmail = userinfo.email;
        }
      }
    } catch (e) {
      console.warn('[GmailService] Could not fetch userinfo email:', e);
    }

    const now = new Date().toISOString();
    const currentState = this.loadState();
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
   * RefreshAccessToken Function: Uses refresh token to retrieve a fresh access token
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

      const data: any = await res.json();
      if (res.ok && data.access_token) {
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

  /**
   * Debug & Diagnostic listIntakeEmails Function
   * Logs pre-call status, post-call HTTP status & response, result size, and message IDs.
   */
  static async listIntakeEmails(): Promise<{
    connected: boolean;
    count: number;
    emails: GmailIntakeMessage[];
    query?: string;
    accountEmail?: string;
    httpStatus?: number;
    resultSizeEstimate?: number;
    messageIds?: string[];
    firstMessageId?: string;
    apiError?: string;
    rawApiResponse?: any;
    message?: string;
  }> {
    const state = this.loadState();
    const accountEmail = state.email || 'Unknown';
    const accessToken = await this.refreshAccessToken();
    const query = 'subject:"NEW PATIENT"';

    // Requirement 2: Log BEFORE API call
    console.log(`==========================================`);
    console.log(`[GmailSearch Diagnostics] BEFORE API CALL:`);
    console.log(`- Connected Gmail Account: ${accountEmail}`);
    console.log(`- Search Query: "${query}"`);
    console.log(`- Access Token Status: ${accessToken ? 'Valid Token Obtained' : 'Expired / Missing Token'}`);
    console.log(`==========================================`);

    if (!accessToken) {
      return {
        connected: false,
        count: 0,
        emails: [],
        query,
        accountEmail,
        apiError: 'Gmail integration is not connected or token is expired.',
        message: 'Gmail integration is not connected.'
      };
    }

    const messagesUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&includeSpamTrash=true`;

    const res = await fetch(messagesUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const httpStatus = res.status;
    const data: any = await res.json();

    // Requirement 3: Log AFTER API response
    console.log(`==========================================`);
    console.log(`[GmailSearch Diagnostics] AFTER API RESPONSE:`);
    console.log(`- HTTP Status: ${httpStatus} ${res.statusText}`);
    console.log(`- Entire Gmail API Response Payload:`, JSON.stringify(data));

    if (!res.ok) {
      console.error(`[GmailSearch Diagnostics] ❌ Gmail API Returned Error:`, data);
      return {
        connected: true,
        count: 0,
        emails: [],
        query,
        accountEmail,
        httpStatus,
        apiError: data.error?.message || `HTTP ${httpStatus} Error`,
        message: data.error?.message || 'Failed to list Gmail messages.'
      };
    }

    const messageItems: any[] = data.messages || [];
    const responseCount = data.resultSizeEstimate !== undefined ? data.resultSizeEstimate : messageItems.length;
    const messageIds = messageItems.map((m: any) => m.id);
    const firstMessageId = messageIds.length > 0 ? messageIds[0] : 'None';

    console.log(`- Result Size Estimate: ${responseCount}`);
    console.log(`- Returned Message IDs Count: ${messageItems.length}`);
    console.log(`- Message IDs:`, messageIds);

    // Requirement 4: Explicitly log zero results
    if (messageItems.length === 0) {
      console.log(`[GmailSearch Diagnostics] ⚠️ EXPLICIT ZERO RESULTS: Gmail API returned ZERO messages for query "${query}". (ResultSizeEstimate: ${responseCount})`);
      console.log(`==========================================`);
      return {
        connected: true,
        count: 0,
        emails: [],
        query,
        accountEmail,
        httpStatus,
        resultSizeEstimate: responseCount,
        messageIds: [],
        firstMessageId: 'None',
        apiError: 'None (0 matching messages)',
        rawApiResponse: data
      };
    }

    console.log(`==========================================`);

    // Fetch details for returned messages
    const intakeMessages: GmailIntakeMessage[] = [];
    let discardedCount = 0;

    for (const msgItem of messageItems.slice(0, 20)) {
      try {
        const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!detailRes.ok) {
          console.warn(`[GmailSearch Diagnostics] Discarded message ID ${msgItem.id}: HTTP ${detailRes.status} on detail fetch.`);
          discardedCount++;
          continue;
        }

        const detail: any = await detailRes.json();
        const headers: any[] = detail.payload?.headers || [];

        const getHeader = (name: string) => {
          const found = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
          return found ? found.value : '';
        };

        const subject = getHeader('Subject') || '(No Subject)';
        const sender = getHeader('From') || 'Unknown Sender';
        const rawDate = getHeader('Date');
        const receivedTime = rawDate ? new Date(rawDate).toISOString() : new Date(parseInt(detail.internalDate || '0', 10)).toISOString();
        const snippet = detail.snippet || '';

        const parseResult = { body: '', attachments: [] as GmailAttachmentInfo[] };
        parseMessageParts(detail.payload, parseResult);

        intakeMessages.push({
          id: detail.id,
          threadId: detail.threadId,
          subject,
          sender,
          receivedTime,
          snippet,
          body: parseResult.body || snippet || '(No body text)',
          attachmentCount: parseResult.attachments.length,
          attachments: parseResult.attachments
        });
      } catch (err) {
        console.error(`[GmailSearch Diagnostics] Discarded message ID ${msgItem.id} due to parse error:`, err);
        discardedCount++;
      }
    }

    // Requirement 5: Log discarded messages if any
    if (discardedCount > 0) {
      console.log(`[GmailSearch Diagnostics] ⚠️ DISCARD IDENTIFIER: ${discardedCount} message(s) were returned by Gmail search but discarded during detail fetch/parse.`);
    }

    return {
      connected: true,
      count: intakeMessages.length,
      emails: intakeMessages,
      query,
      accountEmail,
      httpStatus,
      resultSizeEstimate: responseCount,
      messageIds,
      firstMessageId,
      apiError: 'None',
      rawApiResponse: data
    };
  }
}
