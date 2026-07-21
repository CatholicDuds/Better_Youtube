import { withSupabase } from "npm:@supabase/server@^1";

const USER_DAILY_LIMIT = 10;
const ADMIN_DAILY_LIMIT = 25;
const GLOBAL_DAILY_LIMIT = 50;

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status });
}

export default {
  fetch: withSupabase({ auth: "user" }, async (request, context) => {
    if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

    const apiKey = Deno.env.get("YOUTUBE_API_KEY");
    if (!apiKey) return json({ error: "missing_api_key" }, 503);

    let query = "";
    try {
      const body = await request.json();
      query = String(body?.query || "").trim();
    } catch {
      return json({ error: "invalid_body" }, 400);
    }
    if (query.length < 2 || query.length > 120) return json({ error: "invalid_query" }, 400);

    const { data: hasAccess, error: accessError } = await context.supabase.rpc("current_user_has_access");
    if (accessError || !hasAccess) return json({ error: "access_denied" }, 403);

    const userId = String(context.jwtClaims?.sub || "");
    if (!userId) return json({ error: "invalid_session" }, 401);

    const { data: profile } = await context.supabase.from("profiles").select("role").eq("id", userId).single();
    const userLimit = profile?.role === "admin" ? ADMIN_DAILY_LIMIT : USER_DAILY_LIMIT;
    const since = new Date(Date.now() - 86_400_000).toISOString();

    const [{ count: userCount, error: userCountError }, { count: globalCount, error: globalCountError }] = await Promise.all([
      context.supabaseAdmin.from("youtube_search_usage").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", since),
      context.supabaseAdmin.from("youtube_search_usage").select("id", { count: "exact", head: true }).gte("created_at", since),
    ]);
    if (userCountError || globalCountError) return json({ error: "usage_check_failed" }, 503);
    if ((userCount || 0) >= userLimit || (globalCount || 0) >= GLOBAL_DAILY_LIMIT) return json({ error: "daily_limit" }, 429);

    const { error: usageError } = await context.supabaseAdmin.from("youtube_search_usage").insert({ user_id: userId });
    if (usageError) return json({ error: "usage_write_failed" }, 503);

    const searchParams = new URLSearchParams({
      part: "snippet",
      type: "video",
      maxResults: "25",
      order: "relevance",
      safeSearch: "moderate",
      videoEmbeddable: "true",
      videoSyndicated: "true",
      relevanceLanguage: "pt",
      regionCode: "BR",
      q: query,
      key: apiKey,
    });
    const searchResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?${searchParams}`);
    if (!searchResponse.ok) return json({ error: searchResponse.status === 403 ? "youtube_quota" : "youtube_search_failed" }, 502);

    const searchData = await searchResponse.json();
    const ids = (searchData.items || []).map((item: { id?: { videoId?: string } }) => item.id?.videoId).filter(Boolean);
    if (!ids.length) return json({ items: [] });

    const detailParams = new URLSearchParams({ part: "snippet,contentDetails,statistics,status", id: ids.join(","), key: apiKey });
    const detailResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?${detailParams}`);
    if (!detailResponse.ok) return json({ error: detailResponse.status === 403 ? "youtube_quota" : "youtube_details_failed" }, 502);

    const detailData = await detailResponse.json();
    return json({ items: Array.isArray(detailData.items) ? detailData.items : [] });
  }),
};
