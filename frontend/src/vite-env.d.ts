/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
  readonly VITE_STUN_SERVER: string;
  readonly VITE_TURN_SERVER: string;
  readonly VITE_TURN_USERNAME: string;
  readonly VITE_TURN_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
