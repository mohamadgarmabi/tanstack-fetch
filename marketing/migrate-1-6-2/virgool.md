# مهاجرت از axios، ky، ofetch یا fetch به tanstack-fetch با یک دستور

**زیرتیتر:** یک کلاینت HTTP مناسب TanStack Query — به‌همراه CLI برای پیدا کردن call siteها و اسکفولد React / Vue / Nuxt / Next.js

---

اگر TanStack Query استفاده می‌کنید، `queryFn` از شما سه چیز می‌خواهد:

1. **دیتا برگرداند** (نه Response خام)
2. **روی خطا throw کند** (تا `isError` درست کار کند)
3. **`AbortSignal` را رعایت کند**

بیشتر کلاینت‌های HTTP برای این شکل طراحی نشده‌اند: یا `.data` باز می‌کنید، یا `.json()`، یا `signal` را فراموش می‌کنید.

**tanstack-fetch** برای همین مدل ذهنی Query ساخته شده. در نسخه **۱.۶.۲** یک CLI مایگریت آمده: اسکن axios / ky / ofetch / fetch، ری‌رایت امن، و اسکفولد فریم‌ورک.

> پکیج رسمی TanStack نیست — فقط همان شکل API را هدف گرفته.

مستندات: [راهنمای Migrate](https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate) · [npm](https://www.npmjs.com/package/tanstack-fetch)

---

## قبل

```ts
queryFn: async ({ signal }) => {
  const res = await axios.get('/users', { signal, params: { page: 1 } })
  return res.data
}
```

## بعد

```ts
import { createFetch } from 'tanstack-fetch'

const api = createFetch({ baseUrl: 'https://api.example.com' })

queryFn: ({ signal }) =>
  api.get<User[]>('/users', { signal, query: { page: 1 } })
```

یک کلاینت. دیتا مستقیم، `FetchError`، و `signal` از اول.

---

## CLI

```bash
npm install tanstack-fetch

# فقط گزارش (dry run)
npx tanstack-fetch migrate --from axios --dir ./src
npx tanstack-fetch migrate --from all --dir ./src

# اعمال + اسکفولد
npx tanstack-fetch migrate --from axios --framework react --dir ./src --write
npx tanstack-fetch migrate --from ofetch --framework nuxt --write
npx tanstack-fetch migrate --from fetch --framework nextjs --write
```

| فلگ | معنی |
| --- | --- |
| `--from` | `axios` \| `ky` \| `ofetch` \| `fetch` \| `all` |
| `--framework` | `react` \| `vue` \| `nuxt` \| `nextjs` |
| `--provider` / `--no-provider` | فقط React: با/بدون `FetchProvider` (پیش‌فرض تعاملی: **بدون**) |
| `--write` | ری‌رایت امن + اسکفولد |

`--write` محافظه‌کار است: الگوهای امن را عوض می‌کند و بقیه (پارامتر کوئری، interceptor، `res.ok`) را فقط گزارش می‌دهد. گزارش را حتماً مرور کنید.

---

## نگاشت سریع

| از | به |
| --- | --- |
| `axios.create({ baseURL })` | `createFetch({ baseUrl })` |
| `res.data` / `.json()` | خود `api.get` دیتا برمی‌گرداند |
| `params` (axios) / `searchParams` (ky) | `query` |
| `isAxiosError` | `isFetchError` |

fetch خام بیشتر **گزارش‌محور** است: CLI جاهای `fetch(` و `res.ok` را نشان می‌دهد تا خودتان بلوک را عوض کنید.

---

## اسکفولد فریم‌ورک

| فریم‌ورک | خروجی |
| --- | --- |
| **react** | `api.ts` + `queries/users.ts` (+ اختیاری provider) |
| **vue** | `api.ts` + پلاگین |
| **nuxt** | `api` + پلاگین + `useApi` |
| **nextjs** | کلاینت + `api.server.ts` (کوکی + `ssr-forward`) |

برای React با `--write` می‌پرسد:

```text
Use FetchProvider for React? [y/N]
```

پیش‌فرض **N** است (بدون Provider؛ `client: api` پاس بدهید). با `--provider` یا `--no-provider` از پرسش رد شوید.

---

## چرا؟

- مناسب مستقیم `queryFn`
- خطای تایپ‌شده با status/body
- هندلر ۴۰۱–۴۲۹، refresh token، SSR کوکی، SSE با Authorization
- هسته HTTP حدود **۴.۸KB** gzip

جدول کامل: [Comparison](https://mohamadgarmabi.github.io/tanstack-fetch/guide/comparison)

---

## امتحان کنید

```bash
npx tanstack-fetch migrate --from all --dir ./src
npx tanstack-fetch migrate --from all --framework react --write --no-provider
```

- سایت: https://mohamadgarmabi.github.io/tanstack-fetch/
- مایگریت: https://mohamadgarmabi.github.io/tanstack-fetch/guide/migrate
- گیت‌هاب: https://github.com/mohamadgarmabi/tanstack-fetch

اگر روی پروژه واقعی اجرا کردید، بگویید CLI چه چیزی را گرفت و چه چیزی را از دست داد — همان بازخورد، ترنسفورم بعدی را می‌سازد.
