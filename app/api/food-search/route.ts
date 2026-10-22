import type { NextRequest } from "next/server";

import foodsDb from "@/data/foods-db.json";
import {
  rankResults,
  searchRecords,
  toGrams,
  toSearchResult,
  type ApiItem,
  type DbRecord,
  type FoodSearchResult,
} from "@/lib/food-search";

const ENDPOINT =
  "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03";
const MAX_RESULTS = 20;

// 일반 음식과 외식은 미리 받아 둔 데이터에서 바로 찾는다(키도, 네트워크도 필요 없다).
const RECORDS = foodsDb.records as unknown as DbRecord[];

type ApiBody = { items?: ApiItem[] };

// 시판 제품(약 33만 건)은 용량이 커서 공공 API로 찾는데, API가 느려서(수 초~수십 초)
// 같은 검색어는 잠시 서버 메모리에 둔다.
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; results: FoodSearchResult[] }>();

async function searchProducts(query: string) {
  // 인증키는 서버에서만 읽고 브라우저로 보내지 않는다.
  const key = process.env.FOOD_NUTRITION_API_KEY;
  if (!key) return Response.json({ error: "not-configured" }, { status: 503 });

  const cached = cache.get(query);
  if (cached && Date.now() - cached.at < CACHE_MS) {
    return Response.json({ results: cached.results });
  }

  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    serviceKey: key,
    pageNo: "1",
    numOfRows: "100",
    type: "json",
    FOOD_NM_KR: query,
    DB_CLASS_NM: "상용제품",
  }).toString();

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`upstream ${response.status}`);

    const data = (await response.json()) as {
      header?: { resultCode?: string };
      body?: ApiBody;
    };
    if (data.header?.resultCode !== "00") throw new Error("upstream error");

    const results = (data.body?.items ?? [])
      .map(toSearchResult)
      .filter((result): result is FoodSearchResult => result !== null)
      .map(toGrams);

    const ranked = rankResults(results, query).slice(0, MAX_RESULTS);
    cache.set(query, { at: Date.now(), results: ranked });
    return Response.json({ results: ranked });
  } catch {
    return Response.json({ error: "upstream-failed" }, { status: 502 });
  }
}

/** `scope=foods`(기본)는 미리 받아 둔 일반 음식·외식, `scope=products`는 시판 제품 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 1 || query.length > 30) {
    return Response.json({ error: "bad-query" }, { status: 400 });
  }

  if (request.nextUrl.searchParams.get("scope") === "products") {
    return searchProducts(query);
  }
  return Response.json({ results: searchRecords(RECORDS, query, MAX_RESULTS) });
}
