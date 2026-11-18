# Discord Activity 실행 테스트

기존 Discord 앱을 사용한다. 테스트 서버의 텍스트 채널에서 `/웹앱`을 실행하면 봇이 `LAUNCH_ACTIVITY`(타입 12)로 응답한다. React 화면은 Embedded App SDK의 `ready()`가 완료되면 **Discord Activity 실행 성공!**을 표시한다. [Discord 상호작용 응답](https://docs.discord.com/developers/interactions/receiving-and-responding#interaction-response-object-interaction-callback-type)

## 1. 기존 Discord 앱 설정 확인

1. 기존 애플리케이션을 연다. **Activities → Settings**에서 **Enable Activities**를 켜고 테스트할 플랫폼을 선택한다. 앱 소유자나 개발 팀 계정으로 테스트한다. [Discord Developer Portal](https://discord.com/developers/applications) · [Discord 로컬 개발 가이드](https://docs.discord.com/developers/activities/development-guides/local-development)
2. 테스트 서버에 앱이 이미 설치되어 있다면 그대로 사용한다. 설치가 필요한 경우 **Installation → Guild Install**의 Scopes에 `bot`, `applications.commands`를 추가한 뒤 설치 링크의 **Add to Server**에서 테스트 서버를 선택한다. [Discord 설치 안내](https://docs.discord.com/developers/quick-start/getting-started#adding-scopes-and-bot-permissions)
3. **General Information → Interactions Endpoint URL**을 비워 둔다. 봇은 Gateway의 `INTERACTION_CREATE` 이벤트로 명령어를 받는다. [Discord 상호작용 수신 방식](https://docs.discord.com/developers/interactions/receiving-and-responding#receiving-an-interaction)

## 2. 프로젝트의 .env 채우기

PowerShell에서 작업 폴더로 이동한다. 현재 PC에는 npm 의존성, 빈 `.env`, Windows용 `cloudflared.exe`가 준비되어 있다.

```powershell
cd "$env:USERPROFILE\Desktop\공부\projects\discord-activity-minimal"
```

| 변수 | 입력할 값 |
| --- | --- |
| `DISCORD_APPLICATION_ID` | 기존 앱의 **General Information → Application ID** |
| `DISCORD_BOT_TOKEN` | 같은 앱의 Bot Token. 보관 중인 토큰을 로컬 `.env`에 입력 |
| `DISCORD_GUILD_ID` | Discord **사용자 설정 → 고급 → 개발자 모드**를 켠 뒤 테스트 서버 아이콘 우클릭 → **서버 ID 복사** |

브라우저 빌드에는 공개 값인 Application ID만 들어간다. Git은 `.env`를 제외한다. Client Secret은 필요 없다.

## 3. 앱과 HTTP/2 터널 실행

기존 테스트 프로젝트가 실행 중이라면 해당 봇과 웹 서버를 종료한다. 새 프로젝트 폴더에서 PowerShell 창을 각각 열고 아래 순서로 실행한다.

| 창 | 명령 |
| --- | --- |
| 1 | `npm.cmd run activity` |
| 2 | `npm.cmd run tunnel` |

창 1은 React를 빌드해서 `http://127.0.0.1:5173`에서 제공한다. 창 2는 다음 명령을 실행한다.

```powershell
.\cloudflared.exe tunnel --protocol http2 --edge-ip-version 4 --url http://127.0.0.1:5173 --http-host-header localhost
```

터널 로그에서 `Registered tunnel connection`과 `protocol=http2`가 표시되는지 확인한다. 함께 출력된 `https://…trycloudflare.com` 주소를 브라우저에서 열면 `frame_id`가 없다는 React 안내 화면이 나와야 한다. [Cloudflare 실행 옵션](https://developers.cloudflare.com/tunnel/reference/run-parameters/)

## 4. Discord URL Mapping을 새 주소로 갱신

기존 앱의 **Activities → URL Mappings**에서 Prefix `/`의 Target을 **새 터널의 호스트 이름**으로 바꾼다. 예를 들어 터널 주소가 `https://example-random.trycloudflare.com`이면 `example-random.trycloudflare.com`을 입력하고 저장한다. Discord 클라이언트의 **Application URL Override**는 꺼 둔다. Quick Tunnel을 재시작하면 Target도 새 호스트로 갱신한다. [Discord URL Mapping](https://docs.discord.com/developers/activities/development-guides/local-development#url-mapping)

## 5. 봇 실행하고 Discord 텍스트 채널에서 확인

PowerShell **창 3**에서 같은 프로젝트 폴더로 이동해 실행한다. 봇은 시작할 때 지정한 테스트 서버에 `/웹앱`을 등록하거나 같은 이름의 명령어를 갱신한다. [Discord 서버 명령어 등록](https://docs.discord.com/developers/interactions/application-commands#create-guild-application-command)

```powershell
npm.cmd run bot
```

1. 창 3에 **Gateway 연결 완료**와 **/웹앱 등록 완료**가 표시되는지 확인한다.
2. PowerShell 창 3개를 열어 둔 상태에서 Discord 테스트 서버의 텍스트 채널에 `/웹앱`을 입력한다.
3. 기존 앱의 명령어를 선택해 실행한다. Discord에서 React 화면이 열리고 **Discord Activity 실행 성공!**이 나오면 완료다.

터널 주소가 나왔는데 연결 로그가 없다면 Cloudflare로 나가는 **TCP 7844** 연결을 확인한다. 연결이 등록된 뒤 주소를 찾을 수 없다는 오류가 나오면 잠시 후 같은 주소로 다시 접속한다. 명령어가 안 보이면 봇 로그의 서버 ID와 채널의 **Use Application Commands** 권한을 확인한다. Activity가 열렸는데 빈 화면이면 웹 서버와 터널이 실행 중인지, 매핑이 현재 호스트를 가리키는지 확인한다. [Cloudflare 연결 요건](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/tunnel-with-firewall/#required-for-tunnel-operation)

다른 PC에서 처음 실행할 때는 Node.js 22.12 이상과 npm을 준비하고 `npm.cmd ci` 및 `Copy-Item .env.example .env`를 실행한다. Cloudflare의 Windows 실행 파일을 `cloudflared.exe`라는 이름으로 폴더에 두거나 이미 설치한 `cloudflared`를 PATH에서 사용한다. [Cloudflare 다운로드](https://developers.cloudflare.com/tunnel/downloads/)
