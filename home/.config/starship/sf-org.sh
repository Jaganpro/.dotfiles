#!/bin/sh
# Prints the Salesforce target org for the starship prompt.
#   sf-org.sh normal  -> prints the org unless its name contains "prod"
#   sf-org.sh prod    -> prints the org only if its name contains "prod"
# Exits 1 (prints nothing) outside Salesforce projects.

# Walk up from the current folder to the project root (sfdx-project.json)
dir=$PWD
while [ ! -f "$dir/sfdx-project.json" ]; do
  [ "$dir" = / ] || [ -z "$dir" ] && exit 1
  dir=${dir%/*}
  [ -z "$dir" ] && dir=/
done

# Project setting first, then the global default
for cfg in "$dir/.sf/config.json" "$HOME/.sf/config.json"; do
  org=$(jq -r '."target-org" // empty' "$cfg" 2>/dev/null)
  [ -n "$org" ] && break
done
[ -n "$org" ] || exit 1

case $org in
  *[Pp][Rr][Oo][Dd]*) is_prod=yes ;;
  *) is_prod=no ;;
esac

if { [ "$1" = prod ] && [ $is_prod = yes ]; } || { [ "$1" != prod ] && [ $is_prod = no ]; }; then
  printf '%s' "$org"
else
  exit 1
fi
