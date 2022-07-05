#!/usr/bin/env sh

set -e

mkdir -p repos

function nuke() {
  echo "clone: cleaning $1 to try again"
  rm -rf "repos/$1"
}

function clone() {
  if [ -d "repos/$1" ]
  then
    echo "clone: updating $1"
    git -C "repos/$1" reset --hard
    git -C "repos/$1" pull || nuke "$1"
  fi

  if [ ! -d "repos/$1/" ]
  then
    echo "clone: $2 into $1"
    git -C repos clone "$2" "$1"
  fi
}

clone openlab.ncl.ac.uk git@github.com:digitalinteraction/openlab.ncl.ac.uk.git

clone coffee-club git@github.com:digitalinteraction/beancounter-data.git
