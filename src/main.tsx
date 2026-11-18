import { DiscordSDK } from '@discord/embedded-app-sdk';
import { createRoot } from 'react-dom/client';
import './style.css';

declare const __DISCORD_APPLICATION_ID__: string;

function App({ state, error }: { state: 'connecting' | 'connected' | 'error'; error?: string }) {
  const title = {
    connecting: 'Discord SDK 연결 중…',
    connected: 'Discord Activity 실행 성공!',
    error: 'Discord SDK 연결 실패',
  }[state];
  return (
    <main role="status" data-state={state}>
      <p className="label">Discord Activity</p>
      <h1>{title}</h1>
      {error && <p>{error}</p>}
    </main>
  );
}

async function connect() {
  if (!new URLSearchParams(window.location.search).get('frame_id')) {
    throw new Error('Discord 실행 정보(frame_id)가 없습니다. 테스트 서버의 텍스트 채널에서 /웹앱을 실행하세요.');
  }
  if (!__DISCORD_APPLICATION_ID__) {
    throw new Error('.env에 DISCORD_APPLICATION_ID를 입력하고 npm run activity를 다시 실행하세요.');
  }
  const sdk = new DiscordSDK(__DISCORD_APPLICATION_ID__, { disableConsoleLogOverride: true });
  let timer: number | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => {
        reject(new Error('15초 안에 Discord SDK의 READY 응답을 받지 못했습니다. 앱 ID를 확인하고 Activity를 다시 여세요.'));
      }, 15_000);
    });
    await Promise.race([sdk.ready(), timeout]);
  } finally {
    window.clearTimeout(timer);
  }
}

const root = createRoot(document.getElementById('root')!);
root.render(<App state="connecting" />);
connect().then(
  () => root.render(<App state="connected" />),
  (error: unknown) => root.render(
    <App state="error" error={error instanceof Error ? error.message : String(error)} />,
  ),
);
