# Shared SSH settings for VPS (same defaults as deploy/deploy-from-local.sh).
VPS_HOST="${VPS_HOST:-root@178.172.236.236}"
VPS_SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_rsa_hosterby}"
VPS_KNOWN_HOSTS="${VPS_KNOWN_HOSTS:-$HOME/.ssh/known_hosts_hosterby}"
SSH_OPTS=(-i "$VPS_SSH_KEY" -o IdentitiesOnly=yes -o "UserKnownHostsFile=$VPS_KNOWN_HOSTS" -o StrictHostKeyChecking=accept-new)
SSH=(ssh "${SSH_OPTS[@]}")
