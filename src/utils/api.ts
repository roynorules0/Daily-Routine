export interface FetchTrace {
  url: string;
  routeName: string;
  status: number;
  ok: boolean;
  contentType: string;
  rawResponse: string;
  parsedResponse?: any;
  error?: string;
}

/**
 * Safely executes an HTTP request, checks Content-Type and response status,
 * and compiles comprehensive debugging data so we never encounter blind JSON-parsing exceptions.
 */
export async function traceableFetch(
  url: string,
  routeName: string,
  options?: RequestInit
): Promise<FetchTrace> {
  const trace: FetchTrace = {
    url,
    routeName,
    status: 0,
    ok: false,
    contentType: '',
    rawResponse: '',
  };

  try {
    const res = await fetch(url, options);
    trace.status = res.status;
    trace.ok = res.ok;
    trace.contentType = res.headers.get('content-type') || '';

    const text = await res.text();
    trace.rawResponse = text;

    if (!res.ok) {
      trace.error = `HTTP Error Code: ${res.status}. Status text: ${res.statusText || 'None'}`;
    }

    if (trace.contentType.includes('application/json')) {
      try {
        trace.parsedResponse = JSON.parse(text);
      } catch (parseErr: any) {
        trace.error = `Failed to parse response as JSON: ${parseErr.message || parseErr}`;
      }
    } else {
      // Attempt generic extraction of clean title/message or body snippet if page is HTML
      const htmlSnippet = text.length > 500 ? text.substring(0, 500) + '...' : text;
      let extractedTitle = '';
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        extractedTitle = titleMatch[1];
      }

      trace.error = `Response content type mismatch. Expected 'application/json' but received '${trace.contentType || 'unknown'}'.${
        extractedTitle ? ` Extracted Page Title: "${extractedTitle}".` : ''
      } Raw body snippet: ${htmlSnippet || 'Empty body'}`;
    }
  } catch (err: any) {
    trace.error = `Network or fetch dispatcher exception: ${err.message || String(err)}`;
  }

  return trace;
}

/**
 * Safely parses the JSON from a Response object, performing rigorous content-type matching 
 * and status checking. If the response contains HTML (e.g. from a Vercel routing error page), 
 * it extracts custom diagnostic details (status, titles, raw snippet) without throwing a silent "Unexpected token T" exception.
 */
export async function safeJsonParse(response: Response, apiRouteName: string): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();

  if (!response.ok) {
    let errMessage = `[${apiRouteName}] HTTP Error ${response.status}: ${response.statusText || 'No status text'}`;
    if (!contentType.includes('application/json')) {
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const extractedTitle = titleMatch ? titleMatch[1] : '';
      errMessage += ` (Received HTML/Text: "${extractedTitle || 'Error Page'}". Snippet: ${text.substring(0, 150)}...)`;
    } else {
      try {
        const parsed = JSON.parse(text);
        if (parsed && (parsed.error || parsed.message)) {
          errMessage += ` - ${parsed.error || parsed.message}`;
        }
      } catch (e) {}
    }
    throw new Error(errMessage);
  }

  if (!contentType.includes('application/json')) {
    const titleMatch = text.match(/<title>(.*?)<\/title>/i);
    const extractedTitle = titleMatch ? titleMatch[1] : '';
    throw new Error(
      `[${apiRouteName}] Response mismatch. Expected JSON but received '${contentType || 'blank'}'.${
        extractedTitle ? ` Extracted Page Title: "${extractedTitle}".` : ''
      } Raw snippet: ${text.substring(0, 150)}...`
    );
  }

  try {
    return JSON.parse(text);
  } catch (err: any) {
    throw new Error(`[${apiRouteName}] JSON syntax parse error: ${err.message || err}. Raw body snippet: ${text.substring(0, 150)}...`);
  }
}

