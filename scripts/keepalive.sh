#!/bin/bash
# Keepalive wrapper for the Next.js dev server.
# Restarts the server automatically if it dies (sandbox OOM watchdog kills idle processes).
# Runs in the background, polls every 5s, restarts if HTTP fails.
cd /home/z/my-project

LOG=dev.log
PIDFILE=/tmp/lavadoatp-dev.pid

is_alive() {
  local pid=$(cat "$PIDFILE" 2>/dev/null)
  if [ -z "$pid" ]; then return 1; fi
  if ! kill -0 "$pid" 2>/dev/null; then return 1; fi
  # Also check HTTP health
  local http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null)
  if [ "$http" != "200" ] && [ "$http" != "000" ]; then
    # Non-200 and non-timeout = server responding but error — still alive
    return 0
  fi
  if [ "$http" = "000" ]; then
    # Connection refused = dead
    return 1
  fi
  return 0
}

start_server() {
  # Kill any stale next processes
  pkill -9 -f "next dev" 2>/dev/null
  sleep 1
  # Start fresh
  ./node_modules/.bin/next dev -p 3000 > "$LOG" 2>&1 &
  local new_pid=$!
  echo "$new_pid" > "$PIDFILE"
  echo "[$(date '+%H:%M:%S')] Started dev server (PID $new_pid)"
  # Wait for it to be ready
  for i in $(seq 1 20); do
    sleep 2
    local http=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null)
    if [ "$http" = "200" ]; then
      echo "[$(date '+%H:%M:%S')] Server ready (iter $i)"
      return 0
    fi
  done
  echo "[$(date '+%H:%M:%S')] Server failed to start in 40s"
  return 1
}

# Main loop
while true; do
  if ! is_alive; then
    echo "[$(date '+%H:%M:%S')] Server down — restarting..."
    start_server
  fi
  sleep 5
done
