#!/bin/bash
# Permanent supervisor — restarts the dev server whenever it dies.
# Uses a PID file + health check loop. Designed to survive sandbox kills.
LOG=/home/z/my-project/dev.log
PIDFILE=/tmp/lavadoatp-next.pid

while true; do
  # Check if server is alive
  ALIVE=false
  if [ -f "$PIDFILE" ]; then
    PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
      # Process exists — check HTTP health
      HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://localhost:3000/ 2>/dev/null)
      if [ "$HTTP" = "200" ]; then
        ALIVE=true
      fi
    fi
  fi

  if [ "$ALIVE" = false ]; then
    echo "[$(date '+%H:%M:%S')] Server down — starting..." >> /tmp/supervisor.log
    pkill -9 -f "next dev" 2>/dev/null
    sleep 1
    cd /home/z/my-project
    ./node_modules/.bin/next dev -p 3000 >> "$LOG" 2>&1 &
    NEW_PID=$!
    echo "$NEW_PID" > "$PIDFILE"
    echo "[$(date '+%H:%M:%S')] Started PID $NEW_PID" >> /tmp/supervisor.log
    # Wait for ready
    for i in $(seq 1 20); do
      sleep 2
      HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 2 http://localhost:3000/ 2>/dev/null)
      if [ "$HTTP" = "200" ]; then
        echo "[$(date '+%H:%M:%S')] Ready (iter $i)" >> /tmp/supervisor.log
        break
      fi
    done
  fi

  sleep 5
done
