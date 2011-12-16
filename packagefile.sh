#!/bin/sh

# Packagefile for nl.sinds1984.hotspot
# Helps to set up a custom packaging process
# Run from this directory, may require to create a bin

# Here the only thing different from the usual palm-package process is
# to add the script files afterwards.

APPID=nl.sinds1984.hotspot

# create bin directory if not yet existing
/bin/mkdir bin

# package everything
palm-package --outdir=bin app_src app_package app_service

# add script files to package
/bin/ar -q bin/${APPID}*.ipk pmPostInstall.script
/bin/ar -q bin/${APPID}*.ipk pmPreRemove.script
