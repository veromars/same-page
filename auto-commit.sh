#!/bin/bash
while true; do
  sleep 300  # 5분마다
  git add .
  git commit -m "자동 저장 $(date '+%H:%M')" --allow-empty
done
