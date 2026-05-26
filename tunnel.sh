#!/bin/bash
while true; do
  echo "Starting tunnel..."
  tmole 3000 2>&1 | while IFS= read -r line; do
    echo "$line"
  done
  echo "Tunnel died, restarting in 3s..."
  sleep 3
done
