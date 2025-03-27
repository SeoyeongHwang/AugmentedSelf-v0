# Augmented Self

자기 이해를 돕는 AI 기반 웹 애플리케이션입니다.

## 기술 스택

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase
- OpenAI API
- Firebase (선택사항)

## 시작하기

1. 저장소를 클론합니다:
```bash
git clone https://github.com/your-username/augmented-self.git
cd augmented-self
```

2. 의존성을 설치합니다:
```bash
npm install
```

3. 환경 변수를 설정합니다:
```bash
cp .env.example .env.local
```
`.env.local` 파일을 열고 필요한 API 키와 설정값을 입력합니다.

4. 개발 서버를 실행합니다:
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

## 환경 변수

다음 환경 변수들이 필요합니다:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase 익명 키
- `OPENAI_API_KEY`: OpenAI API 키
- Firebase 관련 변수들 (선택사항)

## Vercel 배포

1. [Vercel](https://vercel.com)에 가입하고 로그인합니다.

2. "New Project" 버튼을 클릭합니다.

3. GitHub 저장소를 선택합니다.

4. 프로젝트 설정에서 다음 환경 변수들을 추가합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`
   - Firebase 관련 변수들 (사용하는 경우)

5. "Deploy" 버튼을 클릭합니다.

Vercel은 자동으로 GitHub 저장소의 변경사항을 감지하고 새로운 배포를 시작합니다.

## 라이선스

MIT License 