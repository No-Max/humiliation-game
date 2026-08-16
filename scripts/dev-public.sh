#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WEB_PORT="${WEB_PORT:-3210}"
API_PORT="${API_PORT:-3200}"
WEB_URL="http://127.0.0.1:${WEB_PORT}"
API_HEALTH="http://127.0.0.1:${API_PORT}/api/health"

SERVER_PID=""
WEB_PID=""
TUNNEL_PID=""
STARTED_SERVER=0
STARTED_WEB=0
TUNNEL_LOG="$(mktemp -t humiliation-tunnel.XXXXXX.log)"

cleanup() {
  trap - EXIT INT TERM
  echo
  echo "Stopping public mode..."
  [[ -n "${TUNNEL_PID}" ]] && kill "${TUNNEL_PID}" 2>/dev/null || true
  if [[ "${STARTED_WEB}" -eq 1 && -n "${WEB_PID}" ]]; then
    kill "${WEB_PID}" 2>/dev/null || true
  fi
  if [[ "${STARTED_SERVER}" -eq 1 && -n "${SERVER_PID}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  rm -f "${TUNNEL_LOG}"
}

trap cleanup EXIT INT TERM

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing dependency: $1" >&2
    if [[ "$1" == "cloudflared" ]]; then
      echo "Install with: brew install cloudflared" >&2
    fi
    exit 1
  fi
}

http_ok() {
  curl -sf --max-time 2 "$1" >/dev/null 2>&1
}

wait_http() {
  local url="$1"
  local label="$2"
  local attempts="${3:-60}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    if http_ok "$url"; then
      echo "✓ ${label} ready"
      return 0
    fi
    sleep 0.5
  done
  echo "Timed out waiting for ${label}: ${url}" >&2
  exit 1
}

need_cmd curl
need_cmd cloudflared
need_cmd npm

if ! http_ok "${API_HEALTH}"; then
  echo "Building shared package..."
  npm run build --workspace=packages/shared
  echo "Starting API on :${API_PORT}..."
  npm run dev:server > /tmp/humiliation-server.log 2>&1 &
  SERVER_PID=$!
  STARTED_SERVER=1
else
  echo "✓ API already running on :${API_PORT}"
fi

if ! http_ok "${WEB_URL}/"; then
  echo "Starting web on :${WEB_PORT}..."
  npm run dev:web > /tmp/humiliation-web.log 2>&1 &
  WEB_PID=$!
  STARTED_WEB=1
else
  echo "✓ Web already running on :${WEB_PORT}"
fi

wait_http "${API_HEALTH}" "API"
wait_http "${WEB_URL}/" "Web"

echo "Opening Cloudflare tunnel..."
cloudflared tunnel --url "${WEB_URL}" >"${TUNNEL_LOG}" 2>&1 &
TUNNEL_PID=$!

PUBLIC_URL=""
for ((i = 1; i <= 90; i++)); do
  PUBLIC_URL="$(grep -Eo 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "${TUNNEL_LOG}" | head -1 || true)"
  if [[ -n "${PUBLIC_URL}" ]]; then
    break
  fi
  if ! kill -0 "${TUNNEL_PID}" 2>/dev/null; then
    echo "Cloudflare tunnel exited unexpectedly:" >&2
    cat "${TUNNEL_LOG}" >&2
    exit 1
  fi
  sleep 0.5
done

if [[ -z "${PUBLIC_URL}" ]]; then
  echo "Could not get public URL from cloudflared. Log:" >&2
  cat "${TUNNEL_LOG}" >&2
  exit 1
fi

echo "Waiting for public URL to become reachable..."
for ((i = 1; i <= 60; i++)); do
  if http_ok "${PUBLIC_URL}/api/health"; then
    break
  fi
  sleep 1
done

cat <<EOF

════════════════════════════════════════
  Game is public

  ${PUBLIC_URL}

  Local web:  ${WEB_URL}
  Local API:  http://127.0.0.1:${API_PORT}

  Press Ctrl+C to stop
════════════════════════════════════════

EOF

wait "${TUNNEL_PID}"
