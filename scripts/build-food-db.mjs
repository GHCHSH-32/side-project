// 식약처 식품영양성분DB(공공데이터포털)에서 일반 음식(품목대표)과 외식 자료를 받아
// data/foods-db.json으로 저장한다. 시판 제품(약 33만 건)은 용량이 커서 제외한다.
//
// 실행: node --env-file=.env.local scripts/build-food-db.mjs
// 공공 API가 자주 느려지므로 실패하면 다시 시도하고, 받은 페이지는 캐시해 두었다가
// 중간에 끊겨도 이어서 받는다. 캐시는 node_modules/.cache/food-db에 저장한다.
import { mkdir, readFile, writeFile } from "node:fs/promises";

import { toRecord, toSearchResult } from "../lib/food-search/index.ts";

const ENDPOINT =
  "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo03/getFoodNtrCpntDbInq03";
const KINDS = ["품목대표", "외식"];
const PAGE_SIZE = 300;
const WORKERS = 3;
const CACHE_DIR = new URL("../node_modules/.cache/food-db/", import.meta.url);
const OUTPUT = new URL("../data/foods-db.json", import.meta.url);

const key = process.env.FOOD_NUTRITION_API_KEY;
if (!key) {
  console.error("FOOD_NUTRITION_API_KEY가 없습니다. --env-file=.env.local로 실행하세요.");
  process.exit(1);
}

async function fetchPage(kind, pageNo) {
  const url = new URL(ENDPOINT);
  url.search = new URLSearchParams({
    serviceKey: key,
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    type: "json",
    DB_CLASS_NM: kind,
  }).toString();

  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.header?.resultCode !== "00" || !data.body) {
        throw new Error(data.header?.resultMsg ?? "응답 형식 오류");
      }
      return data.body;
    } catch (error) {
      console.log(`  ${kind} ${pageNo}쪽 실패(${attempt}/8): ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
  throw new Error(`${kind} ${pageNo}쪽을 받지 못했습니다.`);
}

async function loadPage(kind, pageNo) {
  const file = new URL(`${kind}-${pageNo}.json`, CACHE_DIR);
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    // 캐시가 없으면 새로 받는다.
  }
  const body = await fetchPage(kind, pageNo);
  const records = (body.items ?? [])
    .map(toSearchResult)
    .filter((result) => result !== null)
    .map(toRecord);
  const page = { total: Number(body.totalCount), records };
  await writeFile(file, JSON.stringify(page));
  return page;
}

await mkdir(CACHE_DIR, { recursive: true });
await mkdir(new URL("../data/", import.meta.url), { recursive: true });

const all = [];
for (const kind of KINDS) {
  const first = await loadPage(kind, 1);
  const pages = Math.ceil(first.total / PAGE_SIZE);
  console.log(`${kind}: ${first.total}건, ${pages}쪽`);

  const results = new Array(pages);
  results[0] = first;
  let next = 2;
  let done = 1;
  await Promise.all(
    Array.from({ length: WORKERS }, async () => {
      while (next <= pages) {
        const pageNo = next++;
        results[pageNo - 1] = await loadPage(kind, pageNo);
        done++;
        if (done % 5 === 0 || done === pages) console.log(`  ${kind} ${done}/${pages}쪽 완료`);
      }
    }),
  );
  for (const page of results) all.push(...page.records);
}

// 같은 코드는 한 번만 둔다.
const seen = new Set();
const records = all.filter((record) => {
  if (seen.has(record[0])) return false;
  seen.add(record[0]);
  return true;
});

await writeFile(
  OUTPUT,
  JSON.stringify({
    source: "식품의약품안전처 식품영양성분DB정보(공공데이터포털)",
    generatedAt: new Date().toISOString(),
    kinds: KINDS,
    records,
  }),
);
console.log(`저장 완료: ${records.length}건 → data/foods-db.json`);
