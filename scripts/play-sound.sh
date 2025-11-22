#!/usr/bin/env bash
# Claude Code 処理完了時に効果音を再生するスクリプト

set -euo pipefail

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SOUND_FILE="${PROJECT_ROOT}/sounds/Ping.aiff"

# macOS の場合は afplay を使用
if command -v afplay &> /dev/null; then
  # Ping を3回鳴らす
  for _ in {1..3}; do
    afplay "${SOUND_FILE}"
  done
# Linux の場合は paplay または aplay を使用
elif command -v paplay &> /dev/null; then
  for _ in {1..3}; do
    paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || true
  done
elif command -v aplay &> /dev/null; then
  for _ in {1..3}; do
    aplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null || true
  done
else
  # 効果音コマンドが利用できない場合はビープ音を3回
  for _ in {1..3}; do
    echo -e "\a"
    sleep 0.1
  done
fi
