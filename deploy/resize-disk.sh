#!/usr/bin/env bash
# Расширить корневой раздел после увеличения диска в панели Hoster.by.
# Запуск на сервере от root:
#   bash /opt/humiliation-game/deploy/resize-disk.sh
set -euo pipefail

PART="${DISK_PART:-/dev/sda1}"
DISK="${DISK_DEV:-/dev/sda}"
NUM="${PART_NUM:-1}"

echo "==> До"
df -h /
lsblk

if ! command -v growpart >/dev/null; then
  apt-get update -qq
  apt-get install -y -qq cloud-guest-utils
fi

echo "==> Расширение раздела"
growpart "$DISK" "$NUM"

ROOT_DEV="$(findmnt -n -o SOURCE /)"
echo "==> Расширение ФС на $ROOT_DEV"
if resize2fs "$ROOT_DEV" 2>/dev/null; then
  :
elif command -v xfs_growfs >/dev/null && [[ "$ROOT_DEV" == *mapper* || -b "$(findmnt -n -o FSTYPE /)" == xfs ]]; then
  xfs_growfs /
else
  echo "Не удалось автоматически расширить ФС. Проверьте lsblk и resize2fs вручную." >&2
  exit 1
fi

echo "==> После"
df -h /
lsblk
