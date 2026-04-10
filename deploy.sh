#!/bin/bash
set -e
docker compose build && docker compose up -d
echo "Deployed successfully"
