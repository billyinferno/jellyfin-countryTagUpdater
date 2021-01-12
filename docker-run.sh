#!/bin/sh

docker run -itd --rm -p 4003:80 --rm --name jellyfin-country-tag-updated adimartha/jellyfin-countrytagupdater:latest